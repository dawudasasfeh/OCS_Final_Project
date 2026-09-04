import {createContext, useContext, useState} from "react";
import {jwtDecode} from "jwt-decode";
import client from "../api/client"

const AuthContext = createContext(null);

export function AuthProvider({ children }){
    const [user, setUser] = useState(() => 
    {
        const token = localStorage.getItem("token");
        if(!token)
            return null;
        try{
            return decodeUser(token);
        }catch{
            localStorage.removeItem("token");
            return null
        }
    }
    
    );
    

    function decodeUser(token){
        const c = jwtDecode(token);
        return {
            id : c.sub,
            name : c.name,
            email : c.email,
            role : c["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
            isSubscribed : c.isSubscribed === "true"
        }
    }

    async function login(email, password){
        const {data} = await client.post("auth/login",{email,password});
        localStorage.setItem("token" , data.token);
        setUser(decodeUser(data.token));
    }

    async function register(dto){
        const {data} = await client.post("auth/register",dto);
        localStorage.setItem("token" , data.token);
        setUser(decodeUser(data.token));
    }

    function logout() {
        localStorage.removeItem("token");
        setUser(null);
    }

    return (
        <AuthContext.Provider value = {{user, login, register,logout}}>
            {children}
        </AuthContext.Provider>
    )

}

export const useAuth = () => useContext(AuthContext)