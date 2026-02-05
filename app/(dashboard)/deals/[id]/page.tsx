// app/(dashboard)/deals/[id]/page.tsx

import { Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Briefcase,
    Building2,
    User,
    Calendar,
    TrendingUp,
    DollarSign,
    Clock,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { getDealById } from "@/actions/deals"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { DealActions } from "./deal-actions"

export const metadata: Metadata = {
    title: "Detalhes do Deal | NextCRM",
}

type Props = {
    params: Promise<{ id: string }>
}

async function DealDetails({ id }: { id: string }) {
    const result = await getDealById(id)

    if (!result.success || !result.data) {
        notFound()
    }

    const deal = result.data

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
            OPEN: { label: "Aberto", variant: "default" },
            WON: { label: "Ganho", variant: "secondary" },
            LOST: { label: "Perdido", variant: "destructive" },
            ABANDONED: { label: "Abandonado", variant: "outline" },
        }
        const config = statusConfig[status] || statusConfig.OPEN
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/deals">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <Briefcase className="h-6 w-6" />
                            <h1 className="text-3xl font-bold">{deal.title}</h1>
                            {getStatusBadge(deal.status)}
                        </div>
                        {deal.stage && (
                            <div className="flex items-center gap-2 mt-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: deal.stage.color }}
                                />
                                <span className="text-muted-foreground">{deal.stage.name}</span>
                            </div>
                        )}
                    </div>
                </div>
                <DealActions deal={deal} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Informações principais */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Informações do Deal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Valor e Probabilidade */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <DollarSign className="h-4 w-4" />
                                    Valor
                                </div>
                                <p className="text-3xl font-bold text-primary">
                                    {deal.value ? formatCurrency(deal.value) : "Não informado"}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <TrendingUp className="h-4 w-4" />
                                    Probabilidade
                                </div>
                                <div className="space-y-2">
                                    <p className="text-2xl font-bold">{deal.probability ?? 0}%</p>
                                    <Progress value={deal.probability ?? 0} className="h-2" />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Datas */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                    Data Prevista de Fechamento
                                </p>
                                <p className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {deal.expectedCloseDate
                                        ? format(new Date(deal.expectedCloseDate), "dd/MM/yyyy", { locale: ptBR })
                                        : "Não definida"
                                    }
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                    Criado em
                                </p>
                                <p className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    {format(new Date(deal.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                            </div>
                        </div>

                        {/* Descrição */}
                        {deal.description && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                        Descrição
                                    </p>
                                    <p className="text-sm whitespace-pre-wrap">{deal.description}</p>
                                </div>
                            </>
                        )}

                        {/* Motivo da perda */}
                        {deal.status === "LOST" && deal.lostReason && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-destructive mb-2">
                                        Motivo da Perda
                                    </p>
                                    <p className="text-sm">{deal.lostReason}</p>
                                </div>
                            </>
                        )}

                        {/* Data de fechamento */}
                        {deal.closedAt && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                        {deal.status === "WON" ? "Fechado em" : "Perdido em"}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        {format(new Date(deal.closedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Sidebar com vínculos */}
                <div className="space-y-6">
                    {/* Empresa */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Empresa
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {deal.company ? (
                                <Link
                                    href={`/companies/${deal.company.id}`}
                                    className="text-primary hover:underline font-medium"
                                >
                                    {deal.company.name}
                                </Link>
                            ) : (
                                <p className="text-sm text-muted-foreground">Nenhuma empresa vinculada</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contato */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Contato
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {deal.contact ? (
                                <div>
                                    <Link
                                        href={`/contacts/${deal.contact.id}`}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        {deal.contact.firstName} {deal.contact.lastName}
                                    </Link>
                                    {deal.contact.email && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {deal.contact.email}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Nenhum contato vinculado</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Valor Ponderado */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Valor Ponderado</CardTitle>
                            <CardDescription>
                                Valor × Probabilidade
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {deal.value
                                    ? formatCurrency((deal.value * (deal.probability ?? 0)) / 100)
                                    : "R$ 0,00"
                                }
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function DealLoading() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Carregando deal...</p>
            </div>
        </div>
    )
}

export default async function DealPage({ params }: Props) {
    const { id } = await params

    return (
        <Suspense fallback={<DealLoading />}>
            <DealDetails id={id} />
        </Suspense>
    )
}