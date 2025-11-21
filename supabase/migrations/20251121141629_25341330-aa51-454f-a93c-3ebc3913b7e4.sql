-- Create cart table to store user cart items
CREATE TABLE IF NOT EXISTS public.cart (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

-- Users can view their own cart
CREATE POLICY "Users can view their own cart"
ON public.cart
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add items to their own cart
CREATE POLICY "Users can add to their own cart"
ON public.cart
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own cart items
CREATE POLICY "Users can update their own cart"
ON public.cart
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete items from their own cart
CREATE POLICY "Users can delete from their own cart"
ON public.cart
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_cart_updated_at
BEFORE UPDATE ON public.cart
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_cart_user_id ON public.cart(user_id);
CREATE INDEX idx_cart_product_id ON public.cart(product_id);