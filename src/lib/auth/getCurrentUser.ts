import {getSession} from "next-auth/react";
import {getServerSession} from "next-auth/next";
import {connectToDatabase} from "@/lib/db";
import {User} from "@/models";


export interface CurrentUser {
    email: string
    id: string
    name: string
    roles: string[]
    image: string
    profileCompleted: boolean
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
    const session = await getServerSession();
    const user = session?.user;

    if (!user?.email || !user?.id) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
        roles: user.roles ?? [],
        name: user.name ?? "",
        image: user.image ?? "",
        profileCompleted: user.profileCompleted?? false,
    };
}