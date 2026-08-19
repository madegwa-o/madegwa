import {getServerSession} from "next-auth/next";
import {authOptions} from "@/app/api/auth/[...nextauth]/route";


export interface CurrentUser {
    email: string
    id: string
    name: string
    username: string
    roles: string[]
    image: string
    profileCompleted: boolean
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
    // Pass authOptions so custom session fields (id, username, roles) are included
    const session = await getServerSession(authOptions);
    const user = session?.user;


    if (!user?.email || !user?.id) {
        console.log("Failed validation: Missing email or id on session.user");
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        username: user.username ?? "",
        roles: user.roles ?? [],
        name: user.name ?? "",
        image: user.image ?? "",
        profileCompleted: user.profileCompleted ?? false,
    };
}