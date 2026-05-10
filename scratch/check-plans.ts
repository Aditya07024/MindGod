import mongoose from 'mongoose';
import { SubscriptionPlan } from './backend/src/models/subscription-plan';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function checkPlans() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const plans = await SubscriptionPlan.find({});
  console.log('ALL PLANS:', JSON.stringify(plans, null, 2));
  await mongoose.disconnect();
}

checkPlans();
