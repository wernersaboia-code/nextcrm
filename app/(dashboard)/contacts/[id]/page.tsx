// app/(dashboard)/contacts/[id]/page.tsx

import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building2, Mail, Phone, Smartphone, Briefcase, Calendar, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { getContactById } from "@/actions/contacts"
import { ContactActions } from "./contact-actions"

interface ContactPageProps {
    params: Promise<{ id: string }>
}

const statusColors: Record<string, string> = {
    LEAD: "bg-blue-100 text-blue-800",
    ACTIVE: "bg-green-100 text-green-800",
    CUSTOMER: "bg-purple-100 text-purple-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    CHURNED: "bg-red-100 text-red-800",
}

const statusLabels: Record<string, string> = {
    LEAD: "Lead",
    ACTIVE: "Ativo",
    CUSTOMER: "Cliente",
    INACTIVE: "Inativo",
    CHURNED: "Perdido",
}

export default async function ContactPage({ params }: ContactPageProps) {
    const { id } = await params
    const { data: contact, error } = await getContactById(id)

    if (error || !contact) {
        notFound()
    }

    const fullName = `${contact.firstName} ${contact.lastName}`

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/contacts">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold">{fullName}</h1>
                            <Badge className={statusColors[contact.status]}>
                                {statusLabels[contact.status]}
                            </Badge>
                        </div>
                        {contact.position && (
                            <p className="text-muted-foreground">
                                {contact.position}
                                {contact.company && ` na ${contact.company.name}`}
                            </p>
                        )}
                    </div>
                </div>
                <ContactActions contact={contact} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Informações Principais */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Informações de Contato</CardTitle>
                        <CardDescription>Dados principais do contato</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            {contact.email && (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                        <Mail className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <a
                                            href={`mailto:${contact.email}`}
                                            className="font-medium hover:underline"
                                        >
                                            {contact.email}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {contact.phone && (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                        <Phone className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Telefone</p>
                                        <a
                                            href={`tel:${contact.phone}`}
                                            className="font-medium hover:underline"
                                        >
                                            {contact.phone}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {contact.mobile && (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Celular</p>
                                        <a
                                            href={`tel:${contact.mobile}`}
                                            className="font-medium hover:underline"
                                        >
                                            {contact.mobile}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {contact.company && (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                        <Building2 className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Empresa</p>
                                        <p className="font-medium">{contact.company.name}</p>
                                    </div>
                                </div>
                            )}

                            {contact.department && (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Departamento</p>
                                        <p className="font-medium">{contact.department}</p>
                                    </div>
                                </div>
                            )}

                            {contact.source && (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Origem</p>
                                        <p className="font-medium">{contact.source}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {contact.notes && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                        Observações
                                    </p>
                                    <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Metadados */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Informações do Registro</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Criado em:</span>
                                <span>
                  {new Date(contact.createdAt).toLocaleDateString("pt-BR")}
                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Atualizado em:</span>
                                <span>
                  {new Date(contact.updatedAt).toLocaleDateString("pt-BR")}
                </span>
                            </div>
                            {contact.createdBy && (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Criado por:</span>
                                    <span>{contact.createdBy.name || contact.createdBy.email}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tarefas */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Tarefas</CardTitle>
                            <CardDescription>
                                {contact.tasks.length} tarefa(s) vinculada(s)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {contact.tasks.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Nenhuma tarefa ainda.
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {contact.tasks.slice(0, 5).map((task) => (
                                        <li key={task.id} className="text-sm">
                                            {task.title}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}