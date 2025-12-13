// Background job system for automatic expiration of invitations
import { storage } from "./storage";

class BackgroundJobManager {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  start() {
    console.log("Starting background job manager...");
    
    // Check for expired invitations every 5 minutes
    const expiredInvitationsJob = setInterval(async () => {
      try {
        await this.processExpiredInvitations();
      } catch (error) {
        console.error("Error processing expired invitations:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    this.intervals.set("expiredInvitations", expiredInvitationsJob);
    console.log("Background jobs started successfully");
  }

  stop() {
    console.log("Stopping background job manager...");
    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
      console.log(`Stopped job: ${name}`);
    });
    this.intervals.clear();
  }

  private async processExpiredInvitations() {
    console.log("Checking for expired invitations...");
    
    const expiredInvitations = await storage.getExpiredLessonInvitations();
    
    if (expiredInvitations.length === 0) {
      console.log("No expired invitations found");
      return;
    }

    console.log(`Found ${expiredInvitations.length} expired invitations`);
    
    for (const invitation of expiredInvitations) {
      try {
        // Mark as expired
        await storage.markInvitationAsExpired(invitation.id);
        console.log(`Marked invitation ${invitation.id} as expired`);
        
        // No refund needed since payment wasn't taken yet for invitations
        
      } catch (error) {
        console.error(`Error processing expired invitation ${invitation.id}:`, error);
      }
    }
  }
}

export const backgroundJobManager = new BackgroundJobManager();