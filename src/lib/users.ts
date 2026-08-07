import { connectToDatabase } from "./db"
import { User, Role, type IUser } from "@/models/user"

interface CreateUserData {
    name: string
    email: string
    image?: string
    roles?: Role[]
    password?: string
}

export async function addOrUpdateUser(userData: CreateUserData): Promise<IUser> {
    await connectToDatabase()

    const existingUser = await User.findOne({ email: userData.email })

    if (existingUser) {
        // Update existing user
        existingUser.name = userData.name
        if (userData.image) existingUser.image = userData.image
        existingUser.lastLogin = new Date()
        await existingUser.save()
        return existingUser
    }

    // Create new user
    const newUser = await User.create({
        name: userData.name,
        email: userData.email,
        image: userData.image,
        roles: userData.roles || [Role.USER],
        password: userData.password,
    })

    return newUser
}

export async function getUserByEmail(email: string): Promise<IUser | null> {
    await connectToDatabase()
    return User.findOne({ email }).select("+password")
}

export async function getUserById(id: string): Promise<IUser | null> {
    await connectToDatabase()
    return User.findById(id)
}

export async function updateUserPassword(email: string, password: string): Promise<IUser | null> {
    await connectToDatabase()
    const user = await User.findOne({ email })
    if (!user) return null

    user.password = password
    await user.save()
    return user
}

// Add this to the same file as addOrUpdateUser / getUserByEmail / updateUserPassword

export async function updateUserProfile(
    email: string,
    data: { name?: string; phone?: string }
): Promise<IUser | null> {
    await connectToDatabase()
    const user = await User.findOne({ email })
    if (!user) return null

    if (data.name !== undefined) user.name = data.name
    if (data.phone !== undefined) user.phone = data.phone

    await user.save()
    return user
}
