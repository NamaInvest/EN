import { prisma } from '../prisma';
import crypto from 'crypto';

/**
 * @module RestaurantCoreEngine
 * @description Enterprise-grade engine for managing restaurant tables, QR-based digital menus, and real-time waiter calls.
 * Implements strict security validations to prevent QR token guessing and rate-limiting logical foundations.
 */

export class RestaurantCoreEngine {
  /**
   * Generates a cryptographically secure, un-guessable QR Token for a specific table.
   * This token changes on demand or when a session is closed to prevent malicious "Call Waiter" spam
   * from users outside the restaurant.
   * 
   * @param tenantId The unique identifier of the tenant/restaurant.
   * @param tableId The ID of the table.
   * @returns The updated RestaurantTable object containing the new qrToken.
   */
  static async rotateTableQRToken(tenantId: string, tableId: number) {
    // Generate 32 bytes of secure random hex (64 characters)
    const token = crypto.randomBytes(32).toString('hex');
    
    return await prisma.restaurantTable.update({
      where: { id: tableId, tenantId },
      data: { qrToken: token }
    });
  }

  /**
   * Validates a QR Token and retrieves the associated table information.
   * Acts as the primary authentication middleware for the guest-facing digital menu.
   * 
   * @param qrToken The unique token scanned by the customer.
   * @returns Table and Zone information if valid, throws Error if invalid.
   */
  static async getTableByToken(qrToken: string) {
    if (!qrToken || qrToken.length < 32) {
      throw new Error('SEC_ERR_INVALID_TOKEN_FORMAT');
    }

    const table = await prisma.restaurantTable.findUnique({
      where: { qrToken },
      include: {
        zone: true,
      }
    });

    if (!table) {
      throw new Error('SEC_ERR_TABLE_NOT_FOUND');
    }

    return table;
  }

  /**
   * Initiates a "Call Waiter" request from a specific table.
   * Includes anti-spam logic: If a table already has a PENDING call, it will not create a new one.
   * 
   * @param qrToken The securely generated QR token of the table calling the waiter.
   * @returns The newly created or existing WaiterCall object.
   */
  static async requestWaiter(qrToken: string) {
    const table = await this.getTableByToken(qrToken);

    // Anti-Spam / Idempotency Check: Is there already an active call?
    const existingCall = await prisma.waiterCall.findFirst({
      where: {
        tableId: table.id,
        status: 'PENDING'
      }
    });

    if (existingCall) {
      return existingCall;
    }

    // Create a new Waiter Call
    const call = await prisma.waiterCall.create({
      data: {
        tenantId: table.tenantId,
        tableId: table.id,
        status: 'PENDING'
      }
    });

    // Note: Event emission for WebSockets/SSE should be triggered here 
    // to notify the frontend POS system instantly.

    return call;
  }

  /**
   * Resolves a Waiter Call, marking it as responded.
   * Executed by the Waiter/Cashier from the POS terminal.
   * 
   * @param tenantId Security validation to ensure cross-tenant isolation.
   * @param callId The ID of the waiter call to resolve.
   */
  static async resolveWaiterCall(tenantId: string, callId: number) {
    return await prisma.waiterCall.updateMany({
      where: {
        id: callId,
        tenantId
      },
      data: {
        status: 'RESPONDED',
        resolvedAt: new Date()
      }
    });
  }

  /**
   * Retrieves the live status of all tables and zones for the POS terminal.
   * Used for the interactive Table Grid view.
   * 
   * @param tenantId The unique identifier of the tenant.
   * @returns Structured representation of Zones and their enclosed Tables.
   */
  static async getLiveTableStatus(tenantId: string) {
    return await prisma.restaurantZone.findMany({
      where: { tenantId },
      include: {
        tables: {
          include: {
            waiterCalls: {
              where: { status: 'PENDING' }
            }
          },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
  }
}
