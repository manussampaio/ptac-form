import { useEffect, useRef, useState } from "react";

const API_URL = 'https://jsonplaceholder.typicode.com/users';

async function criarUsuario(novosDados) {
    const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novosDados),
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    return await resp.json()
}

async function atualizarUsuario(id, novosDados) {
    const resp = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novosDados),
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    return await resp.json()
}

async function excluirUsuario(id) {
    const resp = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    return true
}

export default function CrudUsuarios() {
    const [usuarios, setUsuarios] = useState([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState(null)

    const [editando, setEditando] = useState(null)
    const [form, setForm] = useState({ name: '', email: '' })
    const [salvando, setSalvando] = useState(false)
    const [erroForm, setErroForm] = useState(null)

    const [excluindoId, setExcluindoId] = useState(null)
    const [erroExclusao, setErroExclusao] = useState(null)

    const controllersRef = useRef(new Set())

    useEffect(() => {
        return () => {
            controllersRef.current.forEach((controller) => controller.abort())
            controllersRef.current.clear()
        }
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        controllersRef.current.add(controller)

        async function buscarUsuarios() {
            setLoading(true)
            setErro(null)

            try {
                const resp = await fetch(API_URL, { signal: controller.signal })
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
                const data = await resp.json()
                setUsuarios(data)
            } catch (err) {
                if (err.name !== 'AbortError') setErro(err.message)
            } finally {
                controllersRef.current.delete(controller)
                setLoading(false)
            }
        }

        buscarUsuarios()

        return () => controller.abort()
    }, [])

    function editar(usuario) {
        setEditando(usuario)
        setForm({ name: usuario.name, email: usuario.email })
        setErroForm(null)
    }

    function limparForm() {
        setEditando(null)
        setForm({ name: '', email: '' })
        setErroForm(null)
    }

    function handleFormChange(campo, valor) {
        setForm((atual) => ({ ...atual, [campo]: valor }))
    }

    async function salvar(event) {
        event.preventDefault()

        setSalvando(true)
        setErroForm(null)

        if (editando) {
            const prev = usuarios

            setUsuarios((atuais) =>
                atuais.map((u) => (u.id === editando.id ? { ...u, ...form } : u))
            )

            try {
                const atualizado = await atualizarUsuario(editando.id, form)
                setUsuarios((atuais) =>
                    atuais.map((u) => (u.id === editando.id ? atualizado : u))
                )
                limparForm()
            } catch (err) {
                setUsuarios(prev)
                setErroForm(err.message)
            } finally {
                setSalvando(false)
            }
        } else {
            try {
                const criado = await criarUsuario(form)
                setUsuarios((atuais) => [...atuais, criado])
                limparForm()
            } catch (err) {
                setErroForm(err.message)
            } finally {
                setSalvando(false)
            }
        }
    }

    async function tentarExcluir(id) {
        const prev = usuarios

        setExcluindoId(id)
        setErroExclusao(null)
        setUsuarios(prev.filter((u) => u.id !== id))

        try {
            await excluirUsuario(id)
        } catch (err) {
            setUsuarios(prev)
            setErroExclusao(err.message)
        } finally {
            setExcluindoId(null)
        }
    }

    if (loading) return <p>Carregando usuários...</p>

    return (
        <div>
            <h2>Usuários</h2>

            {erro && <p>Erro: {erro}</p>}
            {erroExclusao && <p>Erro ao excluir: {erroExclusao}</p>}

            <form onSubmit={salvar}>
                <h3>{editando ? `Editar usuário #${editando.id}` : 'Novo usuário'}</h3>

                <label>
                    Nome:
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        required
                    />
                </label>

                <label>
                    E-mail:
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        required
                    />
                </label>

                <button type="submit" disabled={salvando}>
                    {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Adicionar'}
                </button>
                <button type="button" onClick={limparForm} disabled={salvando}>
                    Limpar
                </button>

                {erroForm && <p>Erro ao salvar: {erroForm}</p>}
            </form>

            <ul>
                {usuarios.map((usuario) => (
                    <li key={usuario.id}>
                        {usuario.name} - {usuario.email}
                        <button onClick={() => editar(usuario)} style={{ marginLeft: '10px' }}>
                            Editar
                        </button>
                        <button
                            onClick={() => tentarExcluir(usuario.id)}
                            disabled={excluindoId === usuario.id}
                            style={{ marginLeft: '10px' }}
                        >
                            {excluindoId === usuario.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
