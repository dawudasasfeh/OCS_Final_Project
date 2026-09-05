import {createContext, useContext, useEffect, useState} from "react";
import {jwtDecode} from "jwt-decode";
import client from "../api/client"

const AuthContext = createContext(null);

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
    

    // localStorage is shared by every tab on this origin, but this component
    // only read it once at mount. Without this, signing in as someone else in
    // another tab leaves this tab showing the old user while its requests are
    // authenticated as the new one. The event fires only in *other* tabs.
    useEffect(() => {
        function sync(e){
            if(e.key !== "token") return;
            if(!e.newValue) { setUser(null); return; }
            try { setUser(decodeUser(e.newValue)); }
            catch { setUser(null); }
        }
        window.addEventListener("storage", sync);
        return () => window.removeEventListener("storage", sync);
    }, []);

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