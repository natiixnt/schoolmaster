import { storage } from "../server/storage";

export async function createDefaultAdmin() {
  try {
    console.log("Creating default admin account...");
    
    const adminData = {
      username: "admin",
      passwordHash: "admin123", // This will be hashed by the storage method
      email: "admin@matemaster.pl",
      fullName: "Administrator MateMaster",
      isActive: true,
    };
    
    const admin = await storage.createAdminAccount(adminData);
    console.log("Default admin account created successfully!");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Admin ID:", admin.id);
    
    return admin;
  } catch (error) {
    console.error("Error creating admin account:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDefaultAdmin().then(() => process.exit(0));
}