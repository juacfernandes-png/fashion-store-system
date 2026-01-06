import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import * as db from "./db";

// Admin procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== SUPPLIERS ====================
  suppliers: router({
    list: protectedProcedure.query(async () => {
      return db.listSuppliers();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSupplierById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        tradeName: z.string().optional(),
        cnpj: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        contactPerson: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createSupplier(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          tradeName: z.string().optional(),
          cnpj: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          contactPerson: z.string().optional(),
          notes: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateSupplier(input.id, input.data);
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSupplier(input.id);
        return { success: true };
      }),
  }),

  // ==================== CATEGORIES ====================
  categories: router({
    list: protectedProcedure.query(async () => {
      return db.listCategories();
    }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createCategory(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          parentId: z.number().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateCategory(input.id, input.data);
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCategory(input.id);
        return { success: true };
      }),
  }),

  // ==================== PRODUCTS ====================
  products: router({
    list: protectedProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        supplierId: z.number().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listProducts(input);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const product = await db.getProductById(input.id);
        if (!product) return null;
        
        const variants = await db.listProductVariants(input.id);
        const images = await db.listProductImages(input.id);
        const category = product.categoryId ? await db.getCategoryById(product.categoryId) : null;
        const supplier = product.supplierId ? await db.getSupplierById(product.supplierId) : null;
        
        return { ...product, variants, images, category, supplier };
      }),
    
    create: adminProcedure
      .input(z.object({
        code: z.string().min(1),
        barcode: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        supplierId: z.number().optional(),
        brand: z.string().optional(),
        costPrice: z.string(),
        salePrice: z.string(),
        minStock: z.number().default(0),
        maxStock: z.number().default(1000),
        unit: z.string().default("UN"),
        weight: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createProduct(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          barcode: z.string().optional(),
          description: z.string().optional(),
          categoryId: z.number().optional(),
          supplierId: z.number().optional(),
          brand: z.string().optional(),
          costPrice: z.string().optional(),
          salePrice: z.string().optional(),
          minStock: z.number().optional(),
          maxStock: z.number().optional(),
          unit: z.string().optional(),
          weight: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateProduct(input.id, input.data);
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProduct(input.id);
        return { success: true };
      }),
    
    // Variants
    addVariant: adminProcedure
      .input(z.object({
        productId: z.number(),
        sku: z.string().min(1),
        size: z.string().optional(),
        color: z.string().optional(),
        colorHex: z.string().optional(),
        stock: z.number().default(0),
        additionalPrice: z.string().default("0"),
      }))
      .mutation(async ({ input }) => {
        return db.createProductVariant(input);
      }),
    
    updateVariant: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          size: z.string().optional(),
          color: z.string().optional(),
          colorHex: z.string().optional(),
          stock: z.number().optional(),
          additionalPrice: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateProductVariant(input.id, input.data);
      }),
    
    deleteVariant: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProductVariant(input.id);
        return { success: true };
      }),
    
    // Images
    uploadImage: adminProcedure
      .input(z.object({
        productId: z.number(),
        imageData: z.string(), // base64
        fileName: z.string(),
        isPrimary: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.imageData, 'base64');
        const fileKey = `products/${input.productId}/${nanoid()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, 'image/jpeg');
        
        if (input.isPrimary) {
          const existingImages = await db.listProductImages(input.productId);
          for (const img of existingImages) {
            if (img.isPrimary) {
              await db.setPrimaryImage(input.productId, img.id);
            }
          }
        }
        
        return db.createProductImage({
          productId: input.productId,
          url,
          fileKey,
          isPrimary: input.isPrimary,
          sortOrder: 0,
        });
      }),
    
    deleteImage: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProductImage(input.id);
        return { success: true };
      }),
    
    setPrimaryImage: adminProcedure
      .input(z.object({ productId: z.number(), imageId: z.number() }))
      .mutation(async ({ input }) => {
        await db.setPrimaryImage(input.productId, input.imageId);
        return { success: true };
      }),
  }),

  // ==================== CUSTOMERS ====================
  customers: router({
    list: protectedProcedure
      .input(z.object({
        segment: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listCustomers(input);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const customer = await db.getCustomerById(input.id);
        if (!customer) return null;
        
        // Get purchase history
        const orders = await db.listSalesOrders({ customerId: input.id });
        
        return { ...customer, orders };
      }),
    
    create: adminProcedure
      .input(z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        cpf: z.string().optional(),
        birthDate: z.date().optional(),
        gender: z.enum(["M", "F", "O"]).optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        preferences: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createCustomer(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          cpf: z.string().optional(),
          birthDate: z.date().optional(),
          gender: z.enum(["M", "F", "O"]).optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          segment: z.enum(["VIP", "REGULAR", "NEW", "INACTIVE"]).optional(),
          preferences: z.string().optional(),
          notes: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateCustomer(input.id, input.data);
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCustomer(input.id);
        return { success: true };
      }),
  }),

  // ==================== STOCK ====================
  stock: router({
    movements: protectedProcedure
      .input(z.object({
        productId: z.number().optional(),
        type: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listStockMovements(input);
      }),
    
    addMovement: adminProcedure
      .input(z.object({
        productId: z.number(),
        variantId: z.number().optional(),
        type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
        reason: z.enum(["PURCHASE", "SALE", "RETURN", "LOSS", "ADJUSTMENT", "TRANSFER"]),
        quantity: z.number(),
        unitCost: z.string().optional(),
        batch: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
        
        const result = await db.createStockMovement({
          ...input,
          previousStock: product.currentStock,
          newStock: input.type === "IN" 
            ? product.currentStock + input.quantity 
            : input.type === "OUT" 
              ? product.currentStock - input.quantity 
              : input.quantity,
          totalCost: input.unitCost ? (parseFloat(input.unitCost) * input.quantity).toFixed(2) : undefined,
          userId: ctx.user.id,
        });
        
        return result;
      }),
    
    alerts: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().default(true) }).optional())
      .query(async ({ input }) => {
        const alerts = await db.listStockAlerts(input?.unreadOnly ?? true);
        
        // Enrich with product info
        const enrichedAlerts = await Promise.all(alerts.map(async (alert) => {
          const product = await db.getProductById(alert.productId);
          return { ...alert, product };
        }));
        
        return enrichedAlerts;
      }),
    
    markAlertRead: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markAlertAsRead(input.id);
        return { success: true };
      }),
    
    sendAlertNotification: adminProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input }) => {
        const alerts = await db.listStockAlerts(false);
        const alert = alerts.find(a => a.id === input.alertId);
        
        if (!alert) throw new TRPCError({ code: 'NOT_FOUND', message: 'Alerta não encontrado' });
        
        const product = await db.getProductById(alert.productId);
        if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
        
        const alertTypeText = {
          LOW_STOCK: 'Estoque Baixo',
          HIGH_STOCK: 'Estoque Alto',
          OUT_OF_STOCK: 'Sem Estoque'
        };
        
        const success = await notifyOwner({
          title: `Alerta de Estoque: ${alertTypeText[alert.alertType]}`,
          content: `O produto "${product.name}" (${product.code}) está com ${alert.currentStock} unidades em estoque.\n\nLimite configurado: ${alert.threshold} unidades.\n\nAção recomendada: ${alert.alertType === 'LOW_STOCK' || alert.alertType === 'OUT_OF_STOCK' ? 'Realizar pedido de compra' : 'Verificar vendas ou promoções'}`
        });
        
        if (success) {
          await db.markAlertAsNotified(input.alertId);
        }
        
        return { success };
      }),
  }),

  // ==================== PURCHASE ORDERS ====================
  purchaseOrders: router({
    list: protectedProcedure
      .input(z.object({
        supplierId: z.number().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const orders = await db.listPurchaseOrders(input);
        
        // Enrich with supplier info
        const enrichedOrders = await Promise.all(orders.map(async (order) => {
          const supplier = await db.getSupplierById(order.supplierId);
          return { ...order, supplier };
        }));
        
        return enrichedOrders;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await db.getPurchaseOrderById(input.id);
        if (!order) return null;
        
        const supplier = await db.getSupplierById(order.supplierId);
        const items = await db.listPurchaseOrderItems(input.id);
        
        // Enrich items with product info
        const enrichedItems = await Promise.all(items.map(async (item) => {
          const product = await db.getProductById(item.productId);
          const variant = item.variantId ? await db.getProductVariantById(item.variantId) : null;
          return { ...item, product, variant };
        }));
        
        return { ...order, supplier, items: enrichedItems };
      }),
    
    create: adminProcedure
      .input(z.object({
        supplierId: z.number(),
        expectedDate: z.date().optional(),
        notes: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          variantId: z.number().optional(),
          quantity: z.number(),
          unitCost: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const orderNumber = await db.generateOrderNumber('PC');
        
        const subtotal = input.items.reduce((sum, item) => 
          sum + (parseFloat(item.unitCost) * item.quantity), 0);
        
        const order = await db.createPurchaseOrder({
          orderNumber,
          supplierId: input.supplierId,
          expectedDate: input.expectedDate,
          notes: input.notes,
          subtotal: subtotal.toFixed(2),
          total: subtotal.toFixed(2),
          userId: ctx.user.id,
        });
        
        if (order) {
          for (const item of input.items) {
            await db.createPurchaseOrderItem({
              purchaseOrderId: order.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: (parseFloat(item.unitCost) * item.quantity).toFixed(2),
            });
          }
        }
        
        return order;
      }),
    
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["DRAFT", "PENDING", "APPROVED", "ORDERED", "PARTIAL", "RECEIVED", "CANCELLED"]),
      }))
      .mutation(async ({ input }) => {
        return db.updatePurchaseOrder(input.id, { status: input.status });
      }),
    
    receive: adminProcedure
      .input(z.object({
        id: z.number(),
        items: z.array(z.object({
          itemId: z.number(),
          receivedQuantity: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        await db.receivePurchaseOrder(input.id, input.items);
        return { success: true };
      }),
  }),

  // ==================== SALES ORDERS ====================
  salesOrders: router({
    list: protectedProcedure
      .input(z.object({
        customerId: z.number().optional(),
        status: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        const orders = await db.listSalesOrders(input);
        
        // Enrich with customer info
        const enrichedOrders = await Promise.all(orders.map(async (order) => {
          const customer = order.customerId ? await db.getCustomerById(order.customerId) : null;
          return { ...order, customer };
        }));
        
        return enrichedOrders;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await db.getSalesOrderById(input.id);
        if (!order) return null;
        
        const customer = order.customerId ? await db.getCustomerById(order.customerId) : null;
        const items = await db.listSalesOrderItems(input.id);
        
        // Enrich items with product info
        const enrichedItems = await Promise.all(items.map(async (item) => {
          const product = await db.getProductById(item.productId);
          const variant = item.variantId ? await db.getProductVariantById(item.variantId) : null;
          return { ...item, product, variant };
        }));
        
        return { ...order, customer, items: enrichedItems };
      }),
    
    create: adminProcedure
      .input(z.object({
        customerId: z.number().optional(),
        deliveryDate: z.date().optional(),
        paymentMethod: z.enum(["CASH", "CREDIT", "DEBIT", "PIX", "TRANSFER", "INSTALLMENT"]).optional(),
        discount: z.string().default("0"),
        shipping: z.string().default("0"),
        notes: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          variantId: z.number().optional(),
          quantity: z.number(),
          unitPrice: z.string(),
          discount: z.string().default("0"),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const orderNumber = await db.generateOrderNumber('PV');
        
        const subtotal = input.items.reduce((sum, item) => 
          sum + (parseFloat(item.unitPrice) * item.quantity) - parseFloat(item.discount), 0);
        
        const total = subtotal - parseFloat(input.discount) + parseFloat(input.shipping);
        
        const order = await db.createSalesOrder({
          orderNumber,
          customerId: input.customerId,
          deliveryDate: input.deliveryDate,
          paymentMethod: input.paymentMethod,
          discount: input.discount,
          shipping: input.shipping,
          notes: input.notes,
          subtotal: subtotal.toFixed(2),
          total: total.toFixed(2),
          userId: ctx.user.id,
        });
        
        if (order) {
          for (const item of input.items) {
            const totalPrice = (parseFloat(item.unitPrice) * item.quantity) - parseFloat(item.discount);
            await db.createSalesOrderItem({
              salesOrderId: order.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              totalPrice: totalPrice.toFixed(2),
            });
          }
        }
        
        return order;
      }),
    
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["DRAFT", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]),
      }))
      .mutation(async ({ input }) => {
        if (input.status === "CONFIRMED") {
          await db.confirmSalesOrder(input.id);
          
          // Create account receivable
          const order = await db.getSalesOrderById(input.id);
          if (order) {
            await db.createAccountReceivable({
              description: `Venda ${order.orderNumber}`,
              customerId: order.customerId,
              salesOrderId: order.id,
              amount: order.total,
              dueDate: new Date(),
            });
          }
        } else {
          await db.updateSalesOrder(input.id, { status: input.status });
        }
        
        return { success: true };
      }),
  }),

  // ==================== ACCOUNTS PAYABLE ====================
  accountsPayable: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        const accounts = await db.listAccountsPayable(input);
        
        // Enrich with supplier info
        const enrichedAccounts = await Promise.all(accounts.map(async (account) => {
          const supplier = account.supplierId ? await db.getSupplierById(account.supplierId) : null;
          return { ...account, supplier };
        }));
        
        return enrichedAccounts;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getAccountPayableById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        description: z.string().min(1),
        supplierId: z.number().optional(),
        category: z.enum(["SUPPLIER", "RENT", "UTILITIES", "SALARY", "TAX", "OTHER"]),
        amount: z.string(),
        dueDate: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createAccountPayable(input);
      }),
    
    pay: adminProcedure
      .input(z.object({
        id: z.number(),
        amount: z.number(),
        paymentMethod: z.enum(["CASH", "CREDIT", "DEBIT", "PIX", "TRANSFER", "CHECK"]),
      }))
      .mutation(async ({ input }) => {
        await db.payAccountPayable(input.id, input.amount, input.paymentMethod);
        return { success: true };
      }),
  }),

  // ==================== ACCOUNTS RECEIVABLE ====================
  accountsReceivable: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        const accounts = await db.listAccountsReceivable(input);
        
        // Enrich with customer info
        const enrichedAccounts = await Promise.all(accounts.map(async (account) => {
          const customer = account.customerId ? await db.getCustomerById(account.customerId) : null;
          return { ...account, customer };
        }));
        
        return enrichedAccounts;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getAccountReceivableById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        description: z.string().min(1),
        customerId: z.number().optional(),
        amount: z.string(),
        dueDate: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createAccountReceivable(input);
      }),
    
    receive: adminProcedure
      .input(z.object({
        id: z.number(),
        amount: z.number(),
        paymentMethod: z.enum(["CASH", "CREDIT", "DEBIT", "PIX", "TRANSFER", "CHECK"]),
      }))
      .mutation(async ({ input }) => {
        await db.receiveAccountReceivable(input.id, input.amount, input.paymentMethod);
        return { success: true };
      }),
  }),

  // ==================== FINANCIAL ====================
  financial: router({
    transactions: protectedProcedure
      .input(z.object({
        type: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isReconciled: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listFinancialTransactions(input);
      }),
    
    reconcile: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.reconcileTransaction(input.id);
        return { success: true };
      }),
    
    cashFlow: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return db.getCashFlowReport(input.startDate, input.endDate);
      }),
  }),

  // ==================== REPORTS ====================
  reports: router({
    inventory: protectedProcedure.query(async () => {
      return db.getInventoryReport();
    }),
    
    lowStock: protectedProcedure.query(async () => {
      return db.getLowStockProducts();
    }),
    
    highStock: protectedProcedure.query(async () => {
      return db.getHighStockProducts();
    }),
    
    sales: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => {
        return db.getSalesReport(input.startDate, input.endDate);
      }),
    
    topProducts: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
        limit: z.number().default(10),
      }))
      .query(async ({ input }) => {
        return db.getTopSellingProducts(input.startDate, input.endDate, input.limit);
      }),
    
    abcAnalysis: protectedProcedure.query(async () => {
      return db.getABCAnalysis();
    }),
  }),

  // ==================== DASHBOARD ====================
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return db.getDashboardStats();
    }),
    
    multiUnit: protectedProcedure
      .input(z.object({ unitId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return db.getMultiUnitDashboardStats(input?.unitId);
      }),
  }),

  // ==================== STORE UNITS ====================
  storeUnits: router({
    list: protectedProcedure
      .input(z.object({ activeOnly: z.boolean().default(true) }).optional())
      .query(async ({ input }) => {
        return db.listStoreUnits(input?.activeOnly ?? true);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getStoreUnitById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        type: z.enum(["STORE", "WAREHOUSE", "ECOMMERCE"]),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        manager: z.string().optional(),
        isDefault: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        return db.createStoreUnit(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          type: z.enum(["STORE", "WAREHOUSE", "ECOMMERCE"]).optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional(),
          manager: z.string().optional(),
          isActive: z.boolean().optional(),
          isDefault: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateStoreUnit(input.id, input.data);
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStoreUnit(input.id);
        return { success: true };
      }),
  }),

  // ==================== UNIT STOCK ====================
  unitStock: router({
    byUnit: protectedProcedure
      .input(z.object({ unitId: z.number() }))
      .query(async ({ input }) => {
        const stocks = await db.listUnitStockByUnit(input.unitId);
        // Enrich with product info
        const enrichedStocks = await Promise.all(stocks.map(async (stock) => {
          const product = await db.getProductById(stock.productId);
          const variant = stock.variantId ? await db.getProductVariantById(stock.variantId) : null;
          return { ...stock, product, variant };
        }));
        return enrichedStocks;
      }),
    
    byProduct: protectedProcedure
      .input(z.object({ productId: z.number(), variantId: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getConsolidatedStock(input.productId, input.variantId);
      }),
    
    update: adminProcedure
      .input(z.object({
        unitId: z.number(),
        productId: z.number(),
        variantId: z.number().optional(),
        quantity: z.number(),
        minStock: z.number().default(0),
        maxStock: z.number().default(1000),
      }))
      .mutation(async ({ input }) => {
        return db.upsertUnitStock(input);
      }),
  }),

  // ==================== UNIT STOCK MOVEMENTS ====================
  unitMovements: router({
    list: protectedProcedure
      .input(z.object({
        unitId: z.number().optional(),
        productId: z.number().optional(),
        variantId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().default(100),
      }).optional())
      .query(async ({ input }) => {
        const movements = await db.listUnitStockMovements(input ?? {});
        // Enrich with product and unit info
        const enriched = await Promise.all(movements.map(async (mov) => {
          const product = await db.getProductById(mov.productId);
          const unit = await db.getStoreUnitById(mov.unitId);
          const variant = mov.variantId ? await db.getProductVariantById(mov.variantId) : null;
          return { ...mov, product, unit, variant };
        }));
        return enriched;
      }),
    
    create: adminProcedure
      .input(z.object({
        unitId: z.number(),
        productId: z.number(),
        variantId: z.number().optional(),
        type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
        reason: z.enum(["PURCHASE", "SALE", "RETURN", "EXCHANGE", "LOSS", "ADJUSTMENT", "TRANSFER_IN", "TRANSFER_OUT", "INVENTORY"]),
        quantity: z.number(),
        unitCost: z.string().optional(),
        batch: z.string().optional(),
        barcode: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createUnitStockMovement({
          ...input,
          previousStock: 0,
          newStock: 0,
          userId: ctx.user.id,
        });
      }),
  }),

  // ==================== STOCK TRANSFERS ====================
  transfers: router({
    list: protectedProcedure
      .input(z.object({
        fromUnitId: z.number().optional(),
        toUnitId: z.number().optional(),
        status: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        const transfers = await db.listStockTransfers(input ?? {});
        // Enrich with unit info
        const enriched = await Promise.all(transfers.map(async (transfer) => {
          const fromUnit = await db.getStoreUnitById(transfer.fromUnitId);
          const toUnit = await db.getStoreUnitById(transfer.toUnitId);
          return { ...transfer, fromUnit, toUnit };
        }));
        return enriched;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getStockTransferWithItems(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        fromUnitId: z.number(),
        toUnitId: z.number(),
        notes: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          variantId: z.number().optional(),
          requestedQuantity: z.number(),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const { items, ...transferData } = input;
        return db.createStockTransfer(
          { ...transferData, requestedBy: ctx.user.id },
          items
        );
      }),
    
    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.approveStockTransfer(input.id, ctx.user.id);
        return { success: true };
      }),
    
    ship: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.shipStockTransfer(input.id);
        return { success: true };
      }),
    
    receive: adminProcedure
      .input(z.object({
        id: z.number(),
        items: z.array(z.object({
          itemId: z.number(),
          receivedQuantity: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.receiveStockTransfer(input.id, ctx.user.id, input.items);
        return { success: true };
      }),
    
    cancel: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateStockTransfer(input.id, { status: "CANCELLED" });
        return { success: true };
      }),
  }),

  // ==================== RETURNS ====================
  returns: router({
    list: protectedProcedure
      .input(z.object({
        customerId: z.number().optional(),
        unitId: z.number().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        const returns = await db.listReturns(input ?? {});
        // Enrich with customer and unit info
        const enriched = await Promise.all(returns.map(async (ret) => {
          const customer = ret.customerId ? await db.getCustomerById(ret.customerId) : null;
          const unit = ret.unitId ? await db.getStoreUnitById(ret.unitId) : null;
          return { ...ret, customer, unit };
        }));
        return enriched;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getReturnWithItems(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        salesOrderId: z.number().optional(),
        customerId: z.number().optional(),
        unitId: z.number().optional(),
        type: z.enum(["RETURN", "EXCHANGE"]),
        reason: z.enum(["DEFECT", "WRONG_SIZE", "WRONG_COLOR", "REGRET", "DAMAGED", "OTHER"]),
        reasonDetails: z.string().optional(),
        refundAmount: z.string().optional(),
        refundMethod: z.enum(["CASH", "CREDIT", "STORE_CREDIT", "EXCHANGE"]).optional(),
        notes: z.string().optional(),
        items: z.array(z.object({
          productId: z.number(),
          variantId: z.number().optional(),
          quantity: z.number(),
          unitPrice: z.string(),
          condition: z.enum(["NEW", "USED", "DAMAGED", "DEFECTIVE"]).default("USED"),
          notes: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { items, ...returnData } = input;
        return db.createReturn(returnData, items);
      }),
    
    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateReturn(input.id, { status: "APPROVED" });
        return { success: true };
      }),
    
    reject: adminProcedure
      .input(z.object({ id: z.number(), reason: z.string().optional() }))
      .mutation(async ({ input }) => {
        await db.updateReturn(input.id, { status: "REJECTED", reasonDetails: input.reason });
        return { success: true };
      }),
    
    process: adminProcedure
      .input(z.object({
        id: z.number(),
        returnToStock: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.processReturn(input.id, ctx.user.id, input.returnToStock);
        return { success: true };
      }),
  }),

  // ==================== BARCODE ====================
  barcode: router({
    lookup: protectedProcedure
      .input(z.object({ barcode: z.string() }))
      .query(async ({ input }) => {
        return db.findProductByBarcode(input.barcode);
      }),
  }),

  // ==================== STOCK TURNOVER ====================
  stockTurnover: router({
    calculate: protectedProcedure
      .input(z.object({
        productId: z.number(),
        unitId: z.number().optional(),
        period: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.calculateStockTurnover(input.productId, input.unitId, input.period);
      }),
    
    report: protectedProcedure
      .input(z.object({
        unitId: z.number().optional(),
        startPeriod: z.string().optional(),
        endPeriod: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getStockTurnoverReport(input?.unitId, input?.startPeriod, input?.endPeriod);
      }),
  }),

  // ==================== COST CENTERS ====================
  costCenters: router({
    list: protectedProcedure.query(async () => {
      return db.listCostCenters();
    }),
    
    create: adminProcedure
      .input(z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        type: z.enum(["OPERATION", "MARKETING", "ADMINISTRATIVE", "FINANCIAL", "OTHER"]),
        description: z.string().optional(),
        budget: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createCostCenter(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          type: z.enum(["OPERATION", "MARKETING", "ADMINISTRATIVE", "FINANCIAL", "OTHER"]).optional(),
          description: z.string().optional(),
          budget: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateCostCenter(input.id, input.data);
      }),
  }),

  // ==================== ACCOUNTS PAYABLE ADVANCED ====================
  payables: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        approvalStatus: z.string().optional(),
        unitId: z.number().optional(),
        costCenterId: z.number().optional(),
        supplierId: z.number().optional(),
        category: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isRecurring: z.boolean().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const payables = await db.listAccountsPayableAdvanced(input ?? {});
        const enriched = await Promise.all(payables.map(async (p) => {
          const supplier = p.supplierId ? await db.getSupplierById(p.supplierId) : null;
          const unit = p.unitId ? await db.getStoreUnitById(p.unitId) : null;
          const costCenter = p.costCenterId ? await db.getCostCenterById(p.costCenterId) : null;
          return { ...p, supplier, unit, costCenter };
        }));
        return enriched;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getAccountPayableAdvancedById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        documentNumber: z.string().optional(),
        description: z.string().min(1),
        supplierId: z.number().optional(),
        purchaseOrderId: z.number().optional(),
        unitId: z.number().optional(),
        costCenterId: z.number().optional(),
        category: z.enum(["SUPPLIER", "RENT", "UTILITIES", "SALARY", "TAX", "MARKETING", "FREIGHT", "SYSTEM", "INSURANCE", "MAINTENANCE", "OTHER"]),
        amount: z.string(),
        dueDate: z.date(),
        paymentMethod: z.enum(["CASH", "CREDIT", "DEBIT", "PIX", "TRANSFER", "CHECK", "BOLETO"]).optional(),
        bankAccount: z.string().optional(),
        isRecurring: z.boolean().default(false),
        recurringFrequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]).optional(),
        recurringEndDate: z.date().optional(),
        totalInstallments: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Se for parcelado, criar múltiplas contas
        if (input.totalInstallments && input.totalInstallments > 1) {
          const installmentAmount = parseFloat(input.amount) / input.totalInstallments;
          for (let i = 0; i < input.totalInstallments; i++) {
            const dueDate = new Date(input.dueDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            await db.createAccountPayableAdvanced({
              ...input,
              amount: installmentAmount.toFixed(2),
              dueDate,
              installmentNumber: i + 1,
              totalInstallments: input.totalInstallments,
              createdBy: ctx.user.id,
            });
          }
        } else {
          await db.createAccountPayableAdvanced({
            ...input,
            createdBy: ctx.user.id,
          });
        }
        return { success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          description: z.string().optional(),
          category: z.enum(["SUPPLIER", "RENT", "UTILITIES", "SALARY", "TAX", "MARKETING", "FREIGHT", "SYSTEM", "INSURANCE", "MAINTENANCE", "OTHER"]).optional(),
          amount: z.string().optional(),
          dueDate: z.date().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updateAccountPayableAdvanced(input.id, input.data);
      }),
    
    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.approveAccountPayable(input.id, ctx.user.id);
        await db.createAuditLog({
          entityType: "ACCOUNT_PAYABLE",
          entityId: input.id,
          action: "APPROVE",
          userId: ctx.user.id,
          userName: ctx.user.name || undefined,
        });
        return { success: true };
      }),
    
    reject: adminProcedure
      .input(z.object({ id: z.number(), reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await db.rejectAccountPayable(input.id, ctx.user.id);
        await db.createAuditLog({
          entityType: "ACCOUNT_PAYABLE",
          entityId: input.id,
          action: "REJECT",
          reason: input.reason,
          userId: ctx.user.id,
          userName: ctx.user.name || undefined,
        });
        return { success: true };
      }),
    
    pay: adminProcedure
      .input(z.object({
        id: z.number(),
        amount: z.number(),
        paymentMethod: z.string(),
        bankAccount: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.payAccountPayableAdvanced(input.id, input.amount, input.paymentMethod, input.bankAccount);
        await db.createAuditLog({
          entityType: "ACCOUNT_PAYABLE",
          entityId: input.id,
          action: "UPDATE",
          fieldChanged: "payment",
          newValue: input.amount.toString(),
          userId: ctx.user.id,
          userName: ctx.user.name || undefined,
        });
        return { success: true };
      }),
  }),

  // ==================== ACCOUNTS RECEIVABLE ADVANCED ====================
  receivables: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        unitId: z.number().optional(),
        customerId: z.number().optional(),
        paymentMethod: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isReconciled: z.boolean().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const receivables = await db.listAccountsReceivableAdvanced(input ?? {});
        const enriched = await Promise.all(receivables.map(async (r) => {
          const customer = r.customerId ? await db.getCustomerById(r.customerId) : null;
          const unit = r.unitId ? await db.getStoreUnitById(r.unitId) : null;
          return { ...r, customer, unit };
        }));
        return enriched;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getAccountReceivableAdvancedById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        documentNumber: z.string().optional(),
        description: z.string().min(1),
        customerId: z.number().optional(),
        salesOrderId: z.number().optional(),
        unitId: z.number().optional(),
        amount: z.string(),
        dueDate: z.date(),
        paymentMethod: z.enum(["CASH", "CREDIT", "DEBIT", "PIX", "TRANSFER", "CHECK", "BOLETO"]).optional(),
        cardBrand: z.string().optional(),
        cardInstallments: z.number().optional(),
        expectedReceiptDate: z.date().optional(),
        acquirerFee: z.string().optional(),
        bankAccount: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Calcular valor líquido se houver taxa
        let netAmount = input.amount;
        if (input.acquirerFee) {
          netAmount = (parseFloat(input.amount) - parseFloat(input.acquirerFee)).toFixed(2);
        }
        await db.createAccountReceivableAdvanced({
          ...input,
          netAmount,
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),
    
    receive: adminProcedure
      .input(z.object({
        id: z.number(),
        amount: z.number(),
        paymentMethod: z.string(),
        bankAccount: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.receiveAccountReceivableAdvanced(input.id, input.amount, input.paymentMethod, input.bankAccount);
        await db.createAuditLog({
          entityType: "ACCOUNT_RECEIVABLE",
          entityId: input.id,
          action: "UPDATE",
          fieldChanged: "receipt",
          newValue: input.amount.toString(),
          userId: ctx.user.id,
          userName: ctx.user.name || undefined,
        });
        return { success: true };
      }),
    
    reconcile: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.reconcileAccountReceivable(input.id, ctx.user.id);
        return { success: true };
      }),
    
    markChargeback: adminProcedure
      .input(z.object({ id: z.number(), reason: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateAccountReceivableAdvanced(input.id, {
          status: "CHARGEBACK",
          chargebackReason: input.reason,
        });
        await db.createAuditLog({
          entityType: "ACCOUNT_RECEIVABLE",
          entityId: input.id,
          action: "UPDATE",
          fieldChanged: "chargeback",
          newValue: input.reason,
          userId: ctx.user.id,
          userName: ctx.user.name || undefined,
        });
        return { success: true };
      }),
  }),

  // ==================== CASH FLOW ====================
  cashFlow: router({
    list: protectedProcedure
      .input(z.object({
        type: z.string().optional(),
        category: z.string().optional(),
        unitId: z.number().optional(),
        costCenterId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isProjected: z.boolean().optional(),
        isReconciled: z.boolean().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listCashFlow(input ?? {});
      }),
    
    summary: protectedProcedure
      .input(z.object({
        unitId: z.number().optional(),
        costCenterId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isProjected: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getCashFlowSummary(input ?? {});
      }),
    
    create: adminProcedure
      .input(z.object({
        type: z.enum(["INCOME", "EXPENSE"]),
        category: z.enum(["SALES", "RECEIVABLES", "OTHER_INCOME", "SUPPLIERS", "FREIGHT", "SALARY", "RENT", "UTILITIES", "MARKETING", "TAX", "FEES", "OTHER_EXPENSE"]),
        subcategory: z.string().optional(),
        description: z.string().min(1),
        amount: z.string(),
        transactionDate: z.date(),
        unitId: z.number().optional(),
        costCenterId: z.number().optional(),
        paymentMethod: z.enum(["CASH", "CREDIT", "DEBIT", "PIX", "TRANSFER", "CHECK", "BOLETO"]).optional(),
        bankAccount: z.string().optional(),
        isProjected: z.boolean().default(false),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createCashFlowEntry({
          ...input,
          userId: ctx.user.id,
        });
        return { success: true };
      }),
    
    reconcile: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.reconcileCashFlowEntry(input.id);
        return { success: true };
      }),
  }),

  // ==================== CMV ====================
  cmv: router({
    calculate: adminProcedure
      .input(z.object({
        period: z.string(),
        unitId: z.number().optional(),
        productId: z.number().optional(),
        categoryId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.calculateCMV(input.period, input.unitId, input.productId, input.categoryId);
      }),
    
    report: protectedProcedure
      .input(z.object({
        period: z.string().optional(),
        unitId: z.number().optional(),
        productId: z.number().optional(),
        categoryId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getCMVReport(input ?? {});
      }),
  }),

  // ==================== DRE ====================
  dre: router({
    calculate: adminProcedure
      .input(z.object({
        period: z.string(),
        unitId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.calculateDRE(input.period, input.unitId);
      }),
    
    report: protectedProcedure
      .input(z.object({
        period: z.string().optional(),
        unitId: z.number().optional(),
        startPeriod: z.string().optional(),
        endPeriod: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getDREReport(input ?? {});
      }),
  }),

  // ==================== PRICING ====================
  pricing: router({
    list: protectedProcedure
      .input(z.object({
        productId: z.number().optional(),
        categoryId: z.number().optional(),
        unitId: z.number().optional(),
        activeOnly: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listPricingRules(input);
      }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        productId: z.number().optional(),
        categoryId: z.number().optional(),
        unitId: z.number().optional(),
        baseCost: z.string().optional(),
        taxRate: z.string().default("0"),
        freightRate: z.string().default("0"),
        commissionRate: z.string().default("0"),
        marketplaceFee: z.string().default("0"),
        acquirerFee: z.string().default("0"),
        targetMargin: z.string(),
        minMargin: z.string().optional(),
        maxMargin: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Calcular preço sugerido
        if (input.baseCost) {
          const result = db.calculateSuggestedPrice(
            parseFloat(input.baseCost),
            parseFloat(input.taxRate),
            parseFloat(input.freightRate),
            parseFloat(input.commissionRate),
            parseFloat(input.marketplaceFee),
            parseFloat(input.acquirerFee),
            parseFloat(input.targetMargin)
          );
          await db.createPricingRule({
            ...input,
            suggestedPrice: result.suggestedPrice.toFixed(2),
          });
        } else {
          await db.createPricingRule(input);
        }
        return { success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          baseCost: z.string().optional(),
          taxRate: z.string().optional(),
          freightRate: z.string().optional(),
          commissionRate: z.string().optional(),
          marketplaceFee: z.string().optional(),
          acquirerFee: z.string().optional(),
          targetMargin: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updatePricingRule(input.id, input.data);
      }),
    
    calculatePrice: protectedProcedure
      .input(z.object({
        baseCost: z.number(),
        taxRate: z.number().default(0),
        freightRate: z.number().default(0),
        commissionRate: z.number().default(0),
        marketplaceFee: z.number().default(0),
        acquirerFee: z.number().default(0),
        targetMargin: z.number(),
      }))
      .query(({ input }) => {
        return db.calculateSuggestedPrice(
          input.baseCost,
          input.taxRate,
          input.freightRate,
          input.commissionRate,
          input.marketplaceFee,
          input.acquirerFee,
          input.targetMargin
        );
      }),
    
    simulateMargin: protectedProcedure
      .input(z.object({
        salePrice: z.number(),
        baseCost: z.number(),
        taxRate: z.number().default(0),
        freightRate: z.number().default(0),
        commissionRate: z.number().default(0),
        marketplaceFee: z.number().default(0),
        acquirerFee: z.number().default(0),
      }))
      .query(({ input }) => {
        return db.simulateMargin(
          input.salePrice,
          input.baseCost,
          input.taxRate,
          input.freightRate,
          input.commissionRate,
          input.marketplaceFee,
          input.acquirerFee
        );
      }),
  }),

  // ==================== PROMOTIONS ====================
  promotions: router({
    list: protectedProcedure
      .input(z.object({
        activeOnly: z.boolean().optional(),
        productId: z.number().optional(),
        categoryId: z.number().optional(),
        unitId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listPromotions(input);
      }),
    
    create: adminProcedure
      .input(z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["PERCENTAGE", "FIXED", "BOGO", "BUNDLE"]),
        discountValue: z.string(),
        minPurchase: z.string().optional(),
        maxDiscount: z.string().optional(),
        productId: z.number().optional(),
        categoryId: z.number().optional(),
        unitId: z.number().optional(),
        startDate: z.date(),
        endDate: z.date(),
        usageLimit: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createPromotion(input);
        return { success: true };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          discountValue: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return db.updatePromotion(input.id, input.data);
      }),
  }),

  // ==================== STOCK ANALYSIS ====================
  stockAnalysis: router({
    calculate: adminProcedure
      .input(z.object({
        period: z.string(),
        unitId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.calculateStockAnalysis(input.period, input.unitId);
      }),
    
    report: protectedProcedure
      .input(z.object({
        period: z.string().optional(),
        unitId: z.number().optional(),
        abcClass: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const analysis = await db.getStockAnalysisReport(input ?? {});
        // Enrich with product info
        const enriched = await Promise.all(analysis.map(async (a) => {
          const product = await db.getProductById(a.productId);
          const category = a.categoryId ? await db.getCategoryById(a.categoryId) : null;
          return { ...a, product, category };
        }));
        return enriched;
      }),
  }),

  // ==================== UNIT PERFORMANCE ====================
  unitPerformance: router({
    calculate: adminProcedure
      .input(z.object({ period: z.string() }))
      .mutation(async ({ input }) => {
        return db.calculateUnitPerformance(input.period);
      }),
    
    report: protectedProcedure
      .input(z.object({
        period: z.string().optional(),
        unitId: z.number().optional(),
        startPeriod: z.string().optional(),
        endPeriod: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const performances = await db.getUnitPerformanceReport(input ?? {});
        // Enrich with unit info
        const enriched = await Promise.all(performances.map(async (p) => {
          const unit = await db.getStoreUnitById(p.unitId);
          return { ...p, unit };
        }));
        return enriched;
      }),
  }),

  // ==================== BANK RECONCILIATION ====================
  bankReconciliation: router({
    list: protectedProcedure
      .input(z.object({
        bankAccount: z.string().optional(),
        status: z.string().optional(),
        period: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listBankReconciliations(input);
      }),
    
    create: adminProcedure
      .input(z.object({
        bankAccount: z.string(),
        period: z.string(),
        openingBalance: z.string(),
        closingBalance: z.string(),
        systemBalance: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const difference = (parseFloat(input.closingBalance) - parseFloat(input.systemBalance)).toFixed(2);
        await db.createBankReconciliation({
          ...input,
          difference,
          status: parseFloat(difference) === 0 ? "RECONCILED" : "DISCREPANCY",
        });
        return { success: true };
      }),
    
    addItem: adminProcedure
      .input(z.object({
        reconciliationId: z.number(),
        transactionDate: z.date(),
        description: z.string(),
        bankAmount: z.string(),
        systemAmount: z.string().optional(),
        cashFlowId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const difference = input.systemAmount 
          ? (parseFloat(input.bankAmount) - parseFloat(input.systemAmount)).toFixed(2)
          : input.bankAmount;
        const status = input.systemAmount && parseFloat(difference) === 0 ? "MATCHED" : "UNMATCHED";
        await db.addReconciliationItem({
          ...input,
          difference,
          status,
        });
        return { success: true };
      }),
    
    getItems: protectedProcedure
      .input(z.object({ reconciliationId: z.number() }))
      .query(async ({ input }) => {
        return db.listReconciliationItems(input.reconciliationId);
      }),
    
    complete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateBankReconciliation(input.id, {
          status: "RECONCILED",
          reconciledBy: ctx.user.id,
          reconciledAt: new Date(),
        });
        return { success: true };
      }),
  }),

  // ==================== AUDIT LOGS ====================
  auditLogs: router({
    list: protectedProcedure
      .input(z.object({
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        action: z.string().optional(),
        userId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.listAuditLogs(input ?? {});
      }),
  }),

  // ==================== SUPPLIER HISTORY ====================
  supplierHistory: router({
    getReport: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(async ({ input }) => {
        return db.getSupplierHistoryReport(input.supplierId);
      }),
    
    addEntry: adminProcedure
      .input(z.object({
        supplierId: z.number(),
        purchaseOrderId: z.number().optional(),
        productId: z.number().optional(),
        unitPrice: z.string(),
        quantity: z.number(),
        totalValue: z.string(),
        paymentTerms: z.string().optional(),
        deliveryDays: z.number().optional(),
        qualityRating: z.number().min(1).max(5).optional(),
        deliveryRating: z.number().min(1).max(5).optional(),
        notes: z.string().optional(),
        purchaseDate: z.date(),
      }))
      .mutation(async ({ input }) => {
        await db.createSupplierHistory(input);
        return { success: true };
      }),
  }),

  // ==================== UTILITIES ====================
  utils: router({
    generateCode: protectedProcedure
      .input(z.object({ prefix: z.string() }))
      .query(async ({ input }) => {
        return db.generateCode(input.prefix);
      }),
    
    getCurrentPeriod: protectedProcedure.query(() => {
      return db.getCurrentPeriod();
    }),
  }),
});

export type AppRouter = typeof appRouter;
