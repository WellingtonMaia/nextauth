import Router from 'next/router';
import { createContext, ReactNode, useEffect, useState } from 'react';
import { api } from '../servers/api';
import { setCookie, parseCookies, destroyCookie } from 'nookies';

type User = {
  email: string;
  permissions: string[];
  roles: string[];
}

type SignInCredentials = {
  email: string;
  password: string;
}

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>;
  user?: User;
  isAuthenticated: boolean;
}

export const AuthContext = createContext({} as AuthContextData);

type AuthProviderProps = {
  children: ReactNode;
}

export function signOut() {
  destroyCookie(undefined, 'nextauth.token');
  destroyCookie(undefined, 'nextauth.refreshToken');
  Router.push('/');
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  useEffect(() => {
    const {'nextauth.token': token} = parseCookies();
    if (token) {
      api.get('/me')
        .then(response => {
          const {email, permissions, roles} = response.data;
          setUser({email, permissions, roles})
        })
        .catch(error => {
          signOut();
          console.log(error);
        });
    }
  }, []);

  async function signIn({email, password}: SignInCredentials) {
    try {
      const response = await api.post('sessions', {
        email, password
      });

      const { token, refreshToken, permissions, roles } = response.data;

      setCookie(undefined, 'nextauth.token', token, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/' //global permission to use the cookies
      });

      setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/' //global permission to use the cookies
      });

      setUser({
        email, permissions, roles
      });
      
      api.defaults.headers['Authorization'] = `Bearer ${token}`

      Router.push('/dashboard')
    } catch (error) {
      alert(error.message);
    }
  } 

  return(
    <AuthContext.Provider value={{signIn, user, isAuthenticated}}>
      {children}
    </AuthContext.Provider>
  )
}