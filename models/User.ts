// User model for MongoDB
import mongoose, { Schema, Model } from "mongoose";

export interface ISavedPaymentMethod {
  paymentMethodId: string; // Stripe payment method ID (pm_xxxxx)
  last4: string; // Last 4 digits of card
  brand: string; // Card brand (visa, mastercard, etc.)
  expiryMonth: number;
  expiryYear: number;
  isDefault?: boolean;
  savedAt: Date;
}

export interface IMembershipDetails {
  customerId?: string; // Stripe customer ID
  membershipType: "internal" | "external";
  price?: number;
  currency?: string;
  lastPaymentDate?: Date;
  paymentIntentId?: string;
  invoiceId?: string; // Stripe invoice ID
  receiptUrl?: string; // Stripe receipt URL
}

export interface IUser {
  name: string;
  email: string;
  password: string;
  membershipDetails?: IMembershipDetails;
  savedPaymentMethods?: ISavedPaymentMethod[]; // Array of saved cards
  createdAt?: Date;
  updatedAt?: Date;
}

const SavedPaymentMethodSchema = new Schema<ISavedPaymentMethod>(
  {
    paymentMethodId: {
      type: String,
      required: true,
    },
    last4: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    expiryMonth: {
      type: Number,
      required: true,
    },
    expiryYear: {
      type: Number,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const MembershipDetailsSchema = new Schema<IMembershipDetails>(
  {
    customerId: {
      type: String,
      default: null,
    },
    membershipType: {
      type: String,
      enum: ["internal", "external"],
      default: "external",
      required: true,
    },
    price: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      default: null,
    },
    lastPaymentDate: {
      type: Date,
      default: null,
    },
    paymentIntentId: {
      type: String,
      default: null,
    },
    invoiceId: {
      type: String,
      default: null,
    },
    receiptUrl: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    membershipDetails: {
      type: MembershipDetailsSchema,
      default: () => ({
        membershipType: "external",
        customerId: null,
        price: null,
        currency: null,
        lastPaymentDate: null,
        paymentIntentId: null,
      }),
    },
    savedPaymentMethods: {
      type: [SavedPaymentMethodSchema],
      default: [],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Prevent model recompilation in development
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
