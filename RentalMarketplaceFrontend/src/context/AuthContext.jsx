import {createContext, useContext, useEffect, useState} from "react";
import {jwtDecode} from "jwt-decode";
import client from "../api/client"

const AuthContext = createContext(null);

// jwtDecode only decodes — it does not validate. An expired token therefore
// yields a perfectly good-looking user object, and the UI shows someone signed
// in while every request they make comes back 401. Throwing here puts expiry on
// the same path as a malformed token, which the callers already handle by
// clearing the session.
function decodeUser(token){
    const c = jwtDecode(token);

    if (typeof c.exp === "number" && c.exp * 1000 <= Date.now())
        throw new Error("token expired");

    // No isSubscribed here on purpose — it is not in the token any more. It was
    // stamped at sign-in and stayed false after an admin confirmed the payment,
    // until the user signed out and back in. SubscriptionContext reads the API.
    return {
        id : c.sub,
        name : c.name,
        email : c.email,
        role : c["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
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

    // The expiry check in decodeUser runs only when a token is read, so a
    // session that simply outlives its token stayed "signed in" while every
    // request failed. Two ways out: a timer for the expiry itself, and any
    // 401 from the API — which also covers a token the server no longer
    // accepts, such as one signed with a key that has since been rotated.
    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem("token");
        const exp = token ? jwtDecode(token).exp : undefined;
        const timer = typeof exp === "number"
            ? setTimeout(() => { localStorage.removeItem("token"); setUser(null); },
                         Math.max(0, exp * 1000 - Date.now()))
            : undefined;

        const interceptor = client.interceptors.response.use(
            (response) => response,
            (error) => {
                // Only when a token was actually sent: a wrong password on the
                // sign-in form is also a 401, and must not clear anything.
                if (error?.response?.status === 401 && localStorage.getItem("token")) {
                    localStorage.removeItem("token");
                    setUser(null);
                }
                return Promise.reject(error);
            });

        return () => {
            clearTimeout(timer);
            client.interceptors.response.eject(interceptor);
        };
    }, [user]);

    return (
        <AuthContext.Provider value = {{user, login, register,logout}}>
            {children}
        </AuthContext.Provider>
    )

}

export const useAuth = () => useContext(AuthContext)