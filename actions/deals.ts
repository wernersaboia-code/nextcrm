// actions/deals.ts

"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { DealStatus } from "@prisma/client"

// Tipos
export type DealFormData = {
    title: string
    value?: number | null
    currency?: string
    status?: DealStatus
    probability?: number | null
    expectedCloseDate?: Date | string | null
    description?: string | null
    stageId?: string | null
    contactId?: string | null
    companyId?: string | null
}

// Função para serializar deal (converter Decimal e Dates)
function serializeDeal(deal: any) {
    if (!deal) return null
    return {
        ...deal,
        value: deal.value ? Number(deal.value) : null,
        createdAt: deal.createdAt?.toISOString?.() || deal.createdAt,
        updatedAt: deal.updatedAt?.toISOString?.() || deal.updatedAt,
        expectedCloseDate: deal.expectedCloseDate?.toISOString?.() || deal.expectedCloseDate,
        closedAt: deal.closedAt?.toISOString?.() || deal.closedAt,
    }
}

// Função para limpar dados
function cleanDealData(data: DealFormData) {
    return {
        title: data.title.trim(),
        value: data.value || null,
        currency: data.currency || "BRL",
        status: data.status || "OPEN",
        probability: data.probability ?? 50,
        expectedCloseDate: data.expectedCloseDate
            ? new Date(data.expectedCloseDate)
            : null,
        description: data.description?.trim() || null,
        stageId: data.stageId || null,
        contactId: data.contactId || null,
        companyId: data.companyId || null,
    }
}

// Obter usuário autenticado
async function getAuthenticatedUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error("Usuário não autenticado")
    }

    return user
}

// CREATE - Criar deal
export async function createDeal(data: DealFormData) {
    try {
        const user = await getAuthenticatedUser()
        const cleanedData = cleanDealData(data)

        // Se não tiver stageId, pegar o primeiro estágio
        let stageId = cleanedData.stageId
        if (!stageId) {
            const firstStage = await prisma.pipelineStage.findFirst({
                where: { isActive: true },
                orderBy: { order: "asc" },
            })
            stageId = firstStage?.id || null
        }

        const deal = await prisma.deal.create({
            data: {
                title: cleanedData.title,
                value: cleanedData.value,
                currency: cleanedData.currency,
                status: cleanedData.status,
                probability: cleanedData.probability,
                expectedCloseDate: cleanedData.expectedCloseDate,
                description: cleanedData.description,
                stage: stageId ? { connect: { id: stageId } } : undefined,
                contact: cleanedData.contactId
                    ? { connect: { id: cleanedData.contactId } }
                    : undefined,
                company: cleanedData.companyId
                    ? { connect: { id: cleanedData.companyId } }
                    : undefined,
                assignedTo: { connect: { id: user.id } },
            },
            include: {
                stage: true,
                contact: true,
                company: true,
            },
        })

        revalidatePath("/deals")
        return { success: true, data: serializeDeal(deal) }
    } catch (error) {
        console.error("Erro ao criar deal:", error)
        return { success: false, error: "Erro ao criar deal" }
    }
}

// READ - Listar deals com estágios (para Kanban)
export async function getDealsWithStages(includeClosedDeals: boolean = false) {
    try {
        const user = await getAuthenticatedUser()

        // Buscar estágios
        const stages = await prisma.pipelineStage.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
        })

        // Buscar deals do usuário
        const deals = await prisma.deal.findMany({
            where: {
                assignedToId: user.id,
                ...(includeClosedDeals ? {} : { status: "OPEN" }),
            },
            include: {
                stage: true,
                contact: {
                    select: { id: true, firstName: true, lastName: true },
                },
                company: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        // Serializar deals
        const serializedDeals = deals.map(serializeDeal)

        return { success: true, data: { stages, deals: serializedDeals } }
    } catch (error) {
        console.error("Erro ao buscar deals:", error)
        return { success: false, error: "Erro ao buscar deals", data: { stages: [], deals: [] } }
    }
}

// READ - Listar todos os deals (para lista)
export async function getDeals(search?: string, status?: DealStatus) {
    try {
        const user = await getAuthenticatedUser()

        const deals = await prisma.deal.findMany({
            where: {
                assignedToId: user.id,
                ...(status && { status }),
                ...(search && {
                    OR: [
                        { title: { contains: search, mode: "insensitive" } },
                        { description: { contains: search, mode: "insensitive" } },
                        { contact: { firstName: { contains: search, mode: "insensitive" } } },
                        { company: { name: { contains: search, mode: "insensitive" } } },
                    ],
                }),
            },
            include: {
                stage: true,
                contact: {
                    select: { id: true, firstName: true, lastName: true },
                },
                company: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        const serializedDeals = deals.map(serializeDeal)

        return { success: true, data: serializedDeals }
    } catch (error) {
        console.error("Erro ao buscar deals:", error)
        return { success: false, error: "Erro ao buscar deals", data: [] }
    }
}

// READ - Buscar deal por ID
export async function getDealById(id: string) {
    try {
        const user = await getAuthenticatedUser()

        const deal = await prisma.deal.findFirst({
            where: {
                id,
                assignedToId: user.id,
            },
            include: {
                stage: true,
                contact: true,
                company: true,
                tasks: {
                    orderBy: { createdAt: "desc" },
                },
                activities: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
            },
        })

        if (!deal) {
            return { success: false, error: "Deal não encontrado" }
        }

        return { success: true, data: serializeDeal(deal) }
    } catch (error) {
        console.error("Erro ao buscar deal:", error)
        return { success: false, error: "Erro ao buscar deal" }
    }
}

// UPDATE - Atualizar deal
export async function updateDeal(id: string, data: DealFormData) {
    try {
        const user = await getAuthenticatedUser()
        const cleanedData = cleanDealData(data)

        // Verifica se o deal pertence ao usuário
        const existing = await prisma.deal.findFirst({
            where: { id, assignedToId: user.id },
        })

        if (!existing) {
            return { success: false, error: "Deal não encontrado" }
        }

        const deal = await prisma.deal.update({
            where: { id },
            data: {
                title: cleanedData.title,
                value: cleanedData.value,
                currency: cleanedData.currency,
                status: cleanedData.status,
                probability: cleanedData.probability,
                expectedCloseDate: cleanedData.expectedCloseDate,
                description: cleanedData.description,
                stageId: cleanedData.stageId,
                contactId: cleanedData.contactId,
                companyId: cleanedData.companyId,
            },
            include: {
                stage: true,
                contact: true,
                company: true,
            },
        })

        revalidatePath("/deals")
        revalidatePath(`/deals/${id}`)
        return { success: true, data: serializeDeal(deal) }
    } catch (error) {
        console.error("Erro ao atualizar deal:", error)
        return { success: false, error: "Erro ao atualizar deal" }
    }
}

// UPDATE - Mover deal para outro estágio (drag and drop)
export async function moveDealToStage(dealId: string, stageId: string) {
    try {
        const user = await getAuthenticatedUser()

        // Verifica se o deal pertence ao usuário
        const existing = await prisma.deal.findFirst({
            where: { id: dealId, assignedToId: user.id },
        })

        if (!existing) {
            return { success: false, error: "Deal não encontrado" }
        }

        const deal = await prisma.deal.update({
            where: { id: dealId },
            data: { stageId },
        })

        revalidatePath("/deals")
        return { success: true, data: serializeDeal(deal) }
    } catch (error) {
        console.error("Erro ao mover deal:", error)
        return { success: false, error: "Erro ao mover deal" }
    }
}

// UPDATE - Marcar deal como ganho
export async function markDealAsWon(id: string) {
    try {
        const user = await getAuthenticatedUser()

        const existing = await prisma.deal.findFirst({
            where: { id, assignedToId: user.id },
        })

        if (!existing) {
            return { success: false, error: "Deal não encontrado" }
        }

        const deal = await prisma.deal.update({
            where: { id },
            data: {
                status: "WON",
                probability: 100,
                closedAt: new Date(),
            },
        })

        revalidatePath("/deals")
        revalidatePath(`/deals/${id}`)
        return { success: true, data: serializeDeal(deal) }
    } catch (error) {
        console.error("Erro ao marcar deal como ganho:", error)
        return { success: false, error: "Erro ao atualizar deal" }
    }
}

// UPDATE - Marcar deal como perdido
export async function markDealAsLost(id: string, lostReason?: string) {
    try {
        const user = await getAuthenticatedUser()

        const existing = await prisma.deal.findFirst({
            where: { id, assignedToId: user.id },
        })

        if (!existing) {
            return { success: false, error: "Deal não encontrado" }
        }

        const deal = await prisma.deal.update({
            where: { id },
            data: {
                status: "LOST",
                probability: 0,
                closedAt: new Date(),
                lostReason: lostReason || null,
            },
        })

        revalidatePath("/deals")
        revalidatePath(`/deals/${id}`)
        return { success: true, data: serializeDeal(deal) }
    } catch (error) {
        console.error("Erro ao marcar deal como perdido:", error)
        return { success: false, error: "Erro ao atualizar deal" }
    }
}

// DELETE - Excluir deal
export async function deleteDeal(id: string) {
    try {
        const user = await getAuthenticatedUser()

        const existing = await prisma.deal.findFirst({
            where: { id, assignedToId: user.id },
        })

        if (!existing) {
            return { success: false, error: "Deal não encontrado" }
        }

        await prisma.deal.delete({
            where: { id },
        })

        revalidatePath("/deals")
        return { success: true }
    } catch (error) {
        console.error("Erro ao excluir deal:", error)
        return { success: false, error: "Erro ao excluir deal" }
    }
}

// Buscar estágios do pipeline
export async function getPipelineStages() {
    try {
        const stages = await prisma.pipelineStage.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
        })

        return { success: true, data: stages }
    } catch (error) {
        console.error("Erro ao buscar estágios:", error)
        return { success: false, error: "Erro ao buscar estágios", data: [] }
    }
}

// Criar estágios padrão (rodar uma vez)
export async function createDefaultStages() {
    try {
        const existingStages = await prisma.pipelineStage.count()

        if (existingStages > 0) {
            return { success: true, message: "Estágios já existem" }
        }

        const defaultStages = [
            { name: "Lead", order: 1, color: "#6B7280" },
            { name: "Qualificação", order: 2, color: "#3B82F6" },
            { name: "Proposta", order: 3, color: "#F59E0B" },
            { name: "Negociação", order: 4, color: "#8B5CF6" },
            { name: "Fechamento", order: 5, color: "#10B981" },
        ]

        await prisma.pipelineStage.createMany({
            data: defaultStages,
        })

        revalidatePath("/deals")
        return { success: true, message: "Estágios criados com sucesso" }
    } catch (error) {
        console.error("Erro ao criar estágios:", error)
        return { success: false, error: "Erro ao criar estágios" }
    }
}