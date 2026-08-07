import { Schema, model, models, Types, Document } from "mongoose";
import bcrypt from "bcryptjs";

export enum Role {
    INTERN = "INTERN",
    EMPLOYEE = "EMPLOYEE",
    CEO = "CEO",
    MANAGER = "MANAGER",
    ADMIN = "ADMIN",
    USER = "USER",
}

export interface IUser extends Document {
    _id: Types.ObjectId;
    username: string;
    name: string;
    email: string;
    password?: string;
    image?: string;
    phone?: string;
    roles: Role[];
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;

    emailVerified: boolean;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;

    passwordResetToken?: string;
    passwordResetExpires?: Date;
    
    // OAuth fields
    googleId?: string;
    authProvider?: 'email' | 'google';
    profileCompleted?: boolean;
    
    comparePassword(candidate: string): Promise<boolean>;
    hasRole(role: Role): boolean;
    addRole(role: Role): void;
    removeRole(role: Role): void;
}

const UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
            lowercase: true,
            minlength: [3, "Username must be at least 3 characters"],
            maxlength: [30, "Username cannot exceed 30 characters"],
            match: [/^[a-zA-Z0-9_.]+$/, "Username can only contain letters, numbers, underscores, and dots"],
            index: true,
        },
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [50, "Name cannot exceed 50 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
            index: true,
        },
        password: {
            type: String,
            minlength: [6, "Password must be at least 6 characters"],
            select: false,
        },
        image: {
            type: String,
            default: null,
        },
        phone: {
            type: String,
            trim: true,
            default: null,
        },
        roles: {
            type: [String],
            enum: Object.values(Role),
            default: [Role.USER],
            index: true,
            validate: {
                validator: function (v: string[]) {
                    return v.length > 0;
                },
                message: "User must have at least one role",
            },
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        lastLogin: {
            type: Date,
            default: null,
        },

        // inside UserSchema fields, alongside isActive/lastLogin
        emailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: {
            type: String,
            select: false,
        },
        emailVerificationExpires: {
            type: Date,
            select: false,
        },

        passwordResetToken: {
            type: String,
            select: false,
        },
        passwordResetExpires: {
            type: Date,
            select: false,
        },
        
        // OAuth fields
        googleId: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        authProvider: {
            type: String,
            enum: ['email', 'google'],
            default: 'email',
            index: true,
        },
        profileCompleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                delete ret.password;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: (_, ret) => {
                delete ret.password;
                return ret;
            },
        },
    }

);

// 📇 Compound indexes for common queries
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ username: 1, isActive: 1 });
UserSchema.index({ roles: 1, isActive: 1 });

// 🧍 Ensure username uniqueness before validation runs (early, friendly error)
UserSchema.pre("validate", async function (next) {
    if (!this.isModified("username")) return next();
    try {
        const existing = await models.User.findOne({
            username: this.username,
            _id: { $ne: this._id }, // exclude self on updates
        });
        if (existing) {
            return next(new Error("Username is already taken"));
        }
        next();
    } catch (error) {
        next(error as Error);
    }
});

// 🔒 Hash password before saving
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password") || !this.password) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// 🧠 Password comparison
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidate, this.password);
};

// 🧩 Role management methods
UserSchema.methods.hasRole = function (role: Role): boolean {
    return this.roles.includes(role);
};
UserSchema.methods.addRole = function (role: Role): void {
    if (!this.roles.includes(role)) {
        this.roles.push(role);
    }
};
UserSchema.methods.removeRole = function (role: Role): void {
    this.roles = this.roles.filter((r: Role) => r !== role);
};

// 🚀 Export
export const User = models.User || model<IUser>("User", UserSchema);
