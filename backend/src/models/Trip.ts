import { model, Schema, Types } from "mongoose";

export const tripInterests = [
  "adventure",
  "relaxation",
  "culture",
  "food",
  "nature",
  "shopping",
  "nightlife",
  "sightseeing",
] as const;

export const accommodationOptions = [
  "budget",
  "standard",
  "premium",
  "luxury",
] as const;

export const tripStyles = [
  "budget_explorer",
  "balanced_experience",
  "premium_experience",
] as const;

export const tripStatuses = [
  "draft",
  "planned",
  "completed",
  "cancelled",
] as const;

export interface TripDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  origin: string;
  destination: string;
  departureDate: Date;
  returnDate: Date;
  travellers: {
    adults: number;
    children: number;
  };
  budget: {
    amount: number;
    currency: "INR";
  };
  interests: (typeof tripInterests)[number][];
  accommodation: (typeof accommodationOptions)[number];
  tripStyle: (typeof tripStyles)[number];
  status: (typeof tripStatuses)[number];
  createdAt: Date;
  updatedAt: Date;
}

const tripSchema = new Schema<TripDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    origin: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    departureDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      required: true,
      validate: {
        validator(this: TripDocument, value: Date) {
          return value >= this.departureDate;
        },
        message: "Return date must be on or after departure.",
      },
    },
    travellers: {
      adults: {
        type: Number,
        required: true,
        min: 1,
        validate: Number.isInteger,
      },
      children: {
        type: Number,
        required: true,
        min: 0,
        validate: Number.isInteger,
      },
    },
    budget: {
      amount: {
        type: Number,
        required: true,
        min: Number.EPSILON,
      },
      currency: {
        type: String,
        enum: ["INR"],
        default: "INR",
        required: true,
      },
    },
    interests: {
      type: [String],
      enum: tripInterests,
      default: [],
    },
    accommodation: {
      type: String,
      enum: accommodationOptions,
      default: "standard",
      required: true,
    },
    tripStyle: {
      type: String,
      enum: tripStyles,
      default: "balanced_experience",
      required: true,
    },
    status: {
      type: String,
      enum: tripStatuses,
      default: "draft",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

tripSchema.index({ userId: 1, createdAt: -1 });

export const Trip = model<TripDocument>("Trip", tripSchema);
