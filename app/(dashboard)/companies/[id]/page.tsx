// app/(dashboard)/companies/[id]/page.tsx

import { Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Building2,
    Globe,
    Users,
    Briefcase,
    ExternalLink,
    Calendar,
} from "lucide-react"

import { getCompanyById } from "@/actions/companies"
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
import { CompanyActions } from "./company-actions"

export const metadata: Metadata = {
    title: "Detalhes da Empresa | NextCRM",
}

type Props = {
    params: Promise<{ id: string }>
}

async function CompanyDetails({ id }: { id: string }) {
    const result = await getCompanyById(id)

    if (!result.success || !result.data) {
        notFound()
    }

    const company = result.data

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/companies">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <Building2 className="h-6 w-6" />
                            <h1 className="text-3xl font-bold">{company.name}</h1>
                        </div>
                        {company.domain && (
                            <p className="text-muted-foreground flex items-center gap-1 mt-1">
                                <Globe className="h-4 w-4" />
                                {company.domain}
                            </p>
                        )}
                    </div>
                </div>
                <CompanyActions company={company} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Informações principais */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Informações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Indústria
                                </p>
                                <p className="mt-1">
                                    {company.industry ? (
                                        <Badge variant="secondary">{company.industry}</Badge>
                                    ) : (
                                        <span className="text-muted-foreground">Não informada</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Tamanho
                                </p>
                                <p className="mt-1">
                                    {company.size || (
                                        <span className="text-muted-foreground">Não informado</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Website
                                </p>
                                <p className="mt-1">
                                    {company.website ? (
                                        <a
                                            href={company.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline inline-flex items-center gap-1"
                                        >
                                            {company.website}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">Não informado</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Criado em
                                </p>
                                <p className="mt-1 flex items-center gap-1">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {new Date(company.createdAt).toLocaleDateString("pt-BR")}
                                </p>
                            </div>
                        </div>

                        {company.description && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                        Descrição
                                    </p>
                                    <p className="text-sm whitespace-pre-wrap">{company.description}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Estatísticas */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Contatos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{company._count.contacts}</p>
                            <p className="text-sm text-muted-foreground">
                                contato{company._count.contacts !== 1 ? "s" : ""} vinculado{company._count.contacts !== 1 ? "s" : ""}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                Deals
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{company._count.deals}</p>
                            <p className="text-sm text-muted-foreground">
                                negociação{company._count.deals !== 1 ? "ões" : ""} ativa{company._count.deals !== 1 ? "s" : ""}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Lista de Contatos */}
            {company.contacts && company.contacts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Contatos da Empresa
                        </CardTitle>
                        <CardDescription>
                            Pessoas vinculadas a esta empresa
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {company.contacts.map((contact) => (
                                <div
                                    key={contact.id}
                                    className="flex items-center justify-between p-3 rounded-lg border"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {contact.firstName} {contact.lastName}
                                        </p>
                                        {contact.email && (
                                            <p className="text-sm text-muted-foreground">
                                                {contact.email}
                                            </p>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/contacts/${contact.id}`}>
                                            Ver
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function CompanyLoading() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Carregando empresa...</p>
            </div>
        </div>
    )
}

export default async function CompanyPage({ params }: Props) {
    const { id } = await params

    return (
        <Suspense fallback={<CompanyLoading />}>
            <CompanyDetails id={id} />
        </Suspense>
    )
}