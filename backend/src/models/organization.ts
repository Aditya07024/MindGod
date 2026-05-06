import mongoose, { Schema, type Document, type Types } from "mongoose";

interface IContract {
  start: Date;
  end: Date;
  pepm: number;
}

interface IDepartment {
  name: string;
  userIds: Types.ObjectId[];
}

export interface IOrganization extends Document {
  name: string;
  type: string;
  seats: number;
  contract: IContract;
  ssoDomain?: string;
  departments: IDepartment[];
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    seats: { type: Number, required: true, default: 0 },
    contract: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
      pepm: { type: Number, required: true }
    },
    ssoDomain: { type: String },
    departments: [
      {
        _id: false,
        name: { type: String, required: true },
        userIds: [{ type: Schema.Types.ObjectId, ref: "User" }]
      }
    ]
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>("Organization", OrganizationSchema);
