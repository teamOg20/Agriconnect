import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const adminEmail = Deno.env.get("ADMIN_EMAIL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

interface OrderEmailRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderId: string;
  items: OrderItem[];
  total: number;
  address: string;
  deliveryTime: string;
  trackingId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: OrderEmailRequest = await req.json();
    console.log("Processing order confirmation email for:", orderData.orderId);

    // Generate items HTML
    const itemsHTML = orderData.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity} ${item.unit}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">₹${item.price * item.quantity}</td>
      </tr>
    `).join('');

    // Customer email HTML
    const customerEmailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .badge { background: #22c55e; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌾 Order Confirmed!</h1>
              <p style="margin: 0; font-size: 18px;">Thank you for your order, ${orderData.customerName}!</p>
            </div>
            
            <div class="content">
              <div class="order-details">
                <h2 style="color: #22c55e; margin-top: 0;">Order Details</h2>
                <p><strong>Order ID:</strong> <span class="badge">${orderData.orderId}</span></p>
                <p><strong>Tracking ID:</strong> ${orderData.trackingId}</p>
                <p><strong>Status:</strong> Order Placed ✅</p>
                ${orderData.deliveryTime ? `<p><strong>Preferred Delivery Time:</strong> ${new Date(orderData.deliveryTime).toLocaleString()}</p>` : ''}
                
                <h3 style="color: #16a34a; margin-top: 25px;">Items Ordered</h3>
                <table>
                  <thead>
                    <tr style="background: #f3f4f6;">
                      <th style="padding: 10px; text-align: left;">Item</th>
                      <th style="padding: 10px; text-align: center;">Quantity</th>
                      <th style="padding: 10px; text-align: right;">Price</th>
                      <th style="padding: 10px; text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHTML}
                  </tbody>
                  <tfoot>
                    <tr style="background: #f3f4f6; font-weight: bold;">
                      <td colspan="3" style="padding: 10px; text-align: right;">Total Amount:</td>
                      <td style="padding: 10px; text-align: right; color: #22c55e; font-size: 18px;">₹${orderData.total}</td>
                    </tr>
                  </tfoot>
                </table>
                
                <h3 style="color: #16a34a; margin-top: 25px;">Delivery Address</h3>
                <p style="background: #f9fafb; padding: 15px; border-left: 4px solid #22c55e; border-radius: 4px;">
                  ${orderData.address}
                </p>
                
                <h3 style="color: #16a34a; margin-top: 25px;">Contact Information</h3>
                <p><strong>Phone:</strong> ${orderData.customerPhone}</p>
                <p><strong>Email:</strong> ${orderData.customerEmail}</p>
              </div>
              
              <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0;"><strong>📱 Track Your Order:</strong> You can track your order status by visiting the Orders page on AgriConnect.</p>
              </div>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="#" style="background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order Status</a>
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">Thank you for choosing AgriConnect!</p>
              <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">Connecting Farmers to the Future 🌱</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Admin notification email HTML
    const adminEmailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Order Received!</h1>
              <p style="margin: 0; font-size: 18px;">Order ${orderData.orderId}</p>
            </div>
            
            <div class="content">
              <div class="alert">
                <p style="margin: 0;"><strong>⚡ Action Required:</strong> A new order has been placed and requires your attention.</p>
              </div>
              
              <h2 style="color: #2563eb;">Order Information</h2>
              <table>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Order ID:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${orderData.orderId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Tracking ID:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${orderData.trackingId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Total Amount:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #22c55e;">₹${orderData.total}</td>
                </tr>
                ${orderData.deliveryTime ? `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Preferred Delivery:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${new Date(orderData.deliveryTime).toLocaleString()}</td>
                </tr>
                ` : ''}
              </table>
              
              <h2 style="color: #2563eb;">Customer Details</h2>
              <table>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${orderData.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${orderData.customerEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${orderData.customerPhone}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Address:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${orderData.address}</td>
                </tr>
              </table>
              
              <h2 style="color: #2563eb;">Items Ordered</h2>
              <table>
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 10px; text-align: left;">Item</th>
                    <th style="padding: 10px; text-align: center;">Quantity</th>
                    <th style="padding: 10px; text-align: right;">Price</th>
                    <th style="padding: 10px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "AgriConnect <onboarding@resend.dev>",
      to: [orderData.customerEmail],
      subject: `Order Confirmation - ${orderData.orderId} 🌾`,
      html: customerEmailHTML,
    });

    console.log("Customer email sent:", customerEmailResponse);

    // Send notification to admin
    if (adminEmail) {
      const adminEmailResponse = await resend.emails.send({
        from: "AgriConnect Orders <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `🔔 New Order: ${orderData.orderId} - ₹${orderData.total}`,
        html: adminEmailHTML,
      });

      console.log("Admin notification sent:", adminEmailResponse);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order confirmation emails sent successfully" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-order-confirmation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
