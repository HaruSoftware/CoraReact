import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { FcGoogle } from 'react-icons/fc'
import './RegisterPage.css'
import { useNavigate } from 'react-router-dom'

function RegisterPage() {
    const navigate = useNavigate()
    const { register } = useAuth()
    const { toast } = useToast()
    const [nomeEmpresa, setNomeEmpresa] = useState('')
    const [emailEmpresa, setEmailEmpresa] = useState('')
    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [erro, setErro] = useState('')
    const [carregando, setCarregando] = useState(false)

    async function handleRegister(event: React.FormEvent) {
        event.preventDefault()

        setErro('')

        if (senha !== confirmarSenha) {
            const msg = 'As senhas não coincidem.'
            setErro(msg)
            toast.warning(msg)
            return
        }

        setCarregando(true)

        try {
            await register(
                nomeEmpresa,
                emailEmpresa,
                nome,
                email,
                senha
            )
            toast.success('Conta criada com sucesso!')
        } catch (error: any) {
            const msg = error instanceof Error ? error.message : 'Erro ao realizar cadastro.'
            setErro(msg)
            toast.error(msg)
        } finally {
            setCarregando(false)
        }
    }

    return (
        <main className="register-page">
            <section className="register-card">

                <div className="register-header">
                    <h1>Criar conta</h1>

                    <p>
                        Comece a gerenciar seu negócio com o Cora.
                    </p>
                </div>

                <form
                    className="register-form"
                    onSubmit={handleRegister}
                >

                    <div className="register-section">
                        <h2>Dados da empresa</h2>

                        <div className="input-group">
                            <label htmlFor="nomeEmpresa">
                                Nome da empresa
                            </label>

                            <input
                                id="nomeEmpresa"
                                type="text"
                                placeholder="Digite o nome da empresa"
                                value={nomeEmpresa}
                                onChange={(event) =>
                                    setNomeEmpresa(event.target.value)
                                }
                                required
                                autoComplete="organization"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="emailEmpresa">
                                E-mail da empresa
                            </label>

                            <input
                                id="emailEmpresa"
                                type="email"
                                placeholder="Digite o e-mail da empresa"
                                value={emailEmpresa}
                                onChange={(event) =>
                                    setEmailEmpresa(event.target.value)
                                }
                                required
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="register-section">
                        <h2>Dados do usuário</h2>

                        <div className="input-group">
                            <label htmlFor="nome">
                                Nome
                            </label>

                            <input
                                id="nome"
                                type="text"
                                placeholder="Digite seu nome"
                                value={nome}
                                onChange={(event) =>
                                    setNome(event.target.value)
                                }
                                required
                                autoComplete="name"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="email">
                                E-mail
                            </label>

                            <input
                                id="email"
                                type="email"
                                placeholder="Digite seu e-mail"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="senha">
                                Senha
                            </label>

                            <input
                                id="senha"
                                type="password"
                                placeholder="Crie uma senha"
                                value={senha}
                                onChange={(event) =>
                                    setSenha(event.target.value)
                                }
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="confirmarSenha">
                                Confirmar senha
                            </label>

                            <input
                                id="confirmarSenha"
                                type="password"
                                placeholder="Digite a senha novamente"
                                value={confirmarSenha}
                                onChange={(event) =>
                                    setConfirmarSenha(event.target.value)
                                }
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    {erro && (
                        <div className="register-error">
                            {erro}
                        </div>
                    )}

                    <button
                        className="register-button"
                        type="submit"
                        disabled={carregando}
                    >
                        {carregando
                            ? 'Criando conta...'
                            : 'Criar conta'}
                    </button>

                    <div className="register-divider">
                        <span>ou</span>
                    </div>
                    <button
                        type="button"
                        className="google-button"
                        onClick={() => {
                            window.location.href = 'http://localhost:3000/api/auth/google'
                        }}
                    >
                        <FcGoogle className="google-icon" />
                        Continuar com Google
                    </button>

                </form>

                <div className="register-footer">
                    <span>
                        Já possui uma conta?
                    </span>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                    >
                        Entrar
                    </button>
                </div>

            </section>
        </main>
    )
}

export default RegisterPage