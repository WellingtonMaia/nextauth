import decode from "jwt-decode";
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../servers/errors/AuthTokenError";
import { validateUserPermissions } from "./validationUserPermission";

type withSSRAuthOptions = {
  permissions?: string[];
  roles?: string[];
}

type User = {
  permissions: string[];
  roles: string[];
}

export function withSSRAuth<P>(
    fn: GetServerSideProps<P>, 
    options?: withSSRAuthOptions
  ) : GetServerSideProps {
  
    return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
    const cookies = parseCookies(context);
    const token = cookies['nextauth.token']
    
    if (!token) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        }
      }
    }

    if (options) {
      const user = decode<User>(token)
      const {permissions, roles} = options;
  
      const userHasValidPermissions = validateUserPermissions({
        user, 
        permissions, 
        roles
      });

      if (!userHasValidPermissions) {
        return {
          // notFound:true
          redirect: {
            destination: '/dashboard',
            permanent: false
          }
        }
      }
    }

    try {
      return await fn(context);
    } catch (err) { 
      if( err instanceof AuthTokenError) {
        destroyCookie(context, 'nextauth.token');
        destroyCookie(context, 'nextauth.refreshToken');
    
        return {
          redirect: {
            destination: '/',
            permanent: false,
          }
        }
      }
      console.log(err)
      return {
        notFound:true,
      }
    } 
  }
}