import axios, { AxiosError } from "axios";
import Router from "next/router";
import { destroyCookie, parseCookies, setCookie } from 'nookies';
import { signOut } from "../contexts/AuthContext";

let cookies = parseCookies();
let isRefreshing = false;
let faildRequestQueue: any[] = [];

export const api = axios.create({
  baseURL: 'http://localhost:3333',
  headers: {
    Authorization: `Bearer ${cookies['nextauth.token']}`
  }
});

api.interceptors.response.use(
  response => response, 
  (error : AxiosError) => {
    if(error.response?.status === 401) {
      if(error.response.data?.code === 'token.expired') {
        //renovar token usuário
        cookies = parseCookies();

        const { 'nextauth.refreshToken': refreshToken } = cookies;
        const originalConfig = error.config;

        if(!isRefreshing) {
          isRefreshing = true;

          api.post('/refresh', {
            refreshToken,
          }).then(response => {
            const {token} = response.data;
  
            setCookie(undefined, 'nextauth.token', token, {
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/' //global permission to use the cookies
            });
      
            setCookie(
              undefined, 
              'nextauth.refreshToken', 
              response.data.refreshToken, 
              {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/' //global permission to use the cookies
              }
            );
  
            api.defaults.headers['Authorization'] = `Bearer ${token}`;
            
            faildRequestQueue.forEach(request => request.onSuccess(token))

            faildRequestQueue = [];
          })
          .catch(err => {
            faildRequestQueue.forEach(request => request.onFailure(err));
            faildRequestQueue = [];
          })
          .finally(() => {
            isRefreshing = false;
          });
        }

        return new Promise((resolve, reject) => {
          faildRequestQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers['Authorization'] = `Bearer ${token}`;
              resolve(api(originalConfig));
            },
            onFailure: (err: AxiosError) => {
              reject(err);
            },
          });
        });
      } else {
        signOut();
      }
    }

    return Promise.reject(error);
  });