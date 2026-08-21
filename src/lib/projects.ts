// import { connectToDatabase } from "./db"
// import { Project } from "@/models/project"

// export interface ProjectOption {
//     _id: string
//     name: string
// }

// // Projects the user owns — used to populate the project picker when creating a key.
// export async function getProjectsForUser(userId: string): Promise<ProjectOption[]> {
//     await connectToDatabase()
//     const projects = await Project.find({ ownerId: userId }).select("name").sort({ name: 1 }).lean()
//     return projects.map((p: any) => ({ _id: p._id.toString(), name: p.name }))
// }
