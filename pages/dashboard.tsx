import { useContext, useEffect } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { api } from "../servers/api";

export default function Dashboard() {
  const { user } = useContext(AuthContext); 

  useEffect(() => {
    api.get('/me')
      .then(response => console.log(response))
      .catch(err => console.log(err))
    }, []);

  return (
    <>
      <h1>Dashboard</h1>
      <h4>Usuário: {user?.email}</h4>
    </>
  )
}