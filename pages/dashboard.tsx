import { GetServerSideProps } from "next";
import { destroyCookie } from "nookies";
import { useContext, useEffect } from "react"
import { Can } from "../components/Can";
import { AuthContext } from "../contexts/AuthContext"
import { useCan } from "../hooks/useCan";
import { setupAPIClient } from "../servers/api";
import { api } from "../servers/apiClient";
import { AuthTokenError } from "../servers/errors/AuthTokenError";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
  const { user, signOut } = useContext(AuthContext); 

  useEffect(() => {
    api.get('/me')
      .then(response => console.log(response))
      .catch(err => console.log(err))
    }, []);

  return (
    <>
      <h1>Dashboard</h1>
      <h4>Usuário: {user?.email}</h4>
      <button onClick={signOut}>
        Sign Out
      </button>
      <Can
        permissions={['metrics.list']}
        roles={['administrator']}
      >
        <h5> Métricas </h5>
      </Can>
    </>
  )
}


export const getServerSideProps = withSSRAuth(async (context) => {
  const apiClient = setupAPIClient(context);
  const response = await apiClient.get('/me');
  console.log(response.data);
  
  return {
    props: {}
  }
})