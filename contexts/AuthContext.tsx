import Router from 'next/router';
import { createContext, ReactNode, useEffect, useState } from 'react';
import { api } from '../servers/apiClient';
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
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  user?: User;
  isAuthenticated: boolean;
}

type AuthProviderProps = {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

let authChannel: BroadcastChannel;

export function signOut() {
  destroyCookie(undefined, 'nextauth.token');
  destroyCookie(undefined, 'nextauth.refreshToken');
  // authChannel = new BroadcastChannel('auth')
  authChannel.postMessage('signOut');

  Router.push('/');
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  useEffect(() => {
    authChannel = new BroadcastChannel('auth')
    authChannel.onmessage = (message) => {
        
        switch (message.data) {
          case 'signOut':
            signOut();
            break;
          default:
            break;
        }
    }
  }, []);

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
    <AuthContext.Provider value={{signIn, signOut, user, isAuthenticated}}>
      {children}
    </AuthContext.Provider>
  )
}