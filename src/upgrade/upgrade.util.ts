import { HttpException } from "@nestjs/common";
import { User } from "../user/schemas/user.schema";
import { Requirement } from "./upgrade.interface";

export function setUserRequirements(requirements: Requirement[] | null, currentLevel: number) {
  if (!requirements) {
    return;
  }

  const userRequirements = [];
  for (const requirement of requirements) {
    if (requirement.type === "fixed") {
      userRequirements.push(requirement);
    } else if (requirement.type === "linear") {
      userRequirements.push({
        ...requirement,
        level: currentLevel + requirement.level,
      });
    }
  }
  return userRequirements;
}

export function checkRequirements(user: User, requirements: Requirement[] | null) {
  if (!requirements) {
    return;
  }

  for (const requirement of requirements) {
    switch (requirement.requirement) {
      case "product":
        const userProduct = user.products.find(
          (p) => p.name === requirement.product
        );
        if (!userProduct || userProduct.level < requirement.level) {
          throw new HttpException("Upgrade not unlocked", 400);
        }
        break;

      case "referredUsers":
        if (
          user.referredUsers.length < requirement.level
        ) {
          throw new HttpException(
            `Invite ${requirement.level} users to upgrade`,
            400
          );
        } 
        break;
    }
  }
}
