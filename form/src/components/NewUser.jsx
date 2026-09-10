import { useState } from "react";

export default function NewUser() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [sending, setSending] = useState(false)
    const [error, setError] = useState(null)
    const [created, setCreated] = useState(null)

    async function send(event) {
        event.preventDefault() //impede o padrão (reload da página)

        setSending(true)
        setError(null)
        setCreated(null)

        try {
            const resp = await fetch('https://jsonplaceholder.typicode.com/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, email: email }) //ou {name, email} pq são iguais
            })

            if (!resp) {
                throw new Error(`Erro HTTP: ${resp.status}`)
            }

            const data = await resp.json()
            setCreated(data)

            setName('')
            setEmail('')
        } catch (error) {
            setError(error.message)
        } finally {
            setSending(false)
        }
    }

    return (
        <form onSubmit={send}>
            <label htmlFor="name">Name:</label>
            <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"

            />

            <label htmlFor="email">E-mail:</label>
            <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your e-mail adress"
            />


            <button disabled={sending}>Send</button>

            {sending && <p>Sending...</p>}
            {error && <p>Error: {error} </p>}
            {created && <p>Registered!</p>}

        </form>
    )
}