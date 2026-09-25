"use client"

import { use, useState, useEffect } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/shop-ui/components/navigation"
import { PremiumFooter } from "@/shop-ui/components/premium-footer"
import { ProductGallery } from "@/shop-ui/components/product-gallery"
import { SizeSelector } from "@/shop-ui/components/size-selector"
import { ColorSelector } from "@/shop-ui/components/color-selector"
import { ProductDetailsAccordion } from "@/shop-ui/components/product-details-accordion"
import { RelatedProducts } from "@/shop-ui/components/related-products"
import { getProductById, getRelatedProducts, type Product } from "@/shop-ui/lib/products"
import { useCart } from "@/shop-ui/lib/cart-context"
import { ChevronRight, ShoppingBag, Check } from "lucide-react"

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [product, setProduct] = useState<Product | undefined>(() => getProductById(id))
  const [mounted, setMounted] = useState(false)
  const { addItem } = useCart()
  const [addedToCart, setAddedToCart] = useState(false)
  const [selectedStorage, setSelectedStorage] = useState<string>("")
  const [selectedColor, setSelectedColor] = useState<string>("")

  useEffect(() => {
    setMounted(true)
    const found = getProductById(id)
    setProduct(found)

    const handleUpdate = () => {
      setProduct(getProductById(id))
    }
    window.addEventListener("netily_products_updated", handleUpdate)
    return () => window.removeEventListener("netily_products_updated", handleUpdate)
  }, [id])

  if (!product && !mounted) {
    return <div className="min-h-screen bg-background" />
  }

  if (!product && mounted) {
    notFound()
  }

  const p = product!
  const effectiveStorage = selectedStorage || p.sizes.find((s) => s.available)?.size || p.sizes[0]?.size || "Standard"
  const effectiveColor = selectedColor || p.colors.find((c) => c.available)?.name || p.colors[0]?.name || "Default"

  const relatedProducts = getRelatedProducts(id, 4)

  const accordionItems = [
    { title: "Specifications", content: p.details },
    { title: "In The Box", content: p.materials },
    { title: "Support & Warranty", content: p.care },
    {
      title: "Shipping & Regional Dispatch",
      content: [
        "Regional warehouse dispatch within 24 hours of order confirmation",
        "Express freight across major towns and cities",
        "Transit insurance included on all shipments",
        "Commercial invoice and delivery note enclosed for tax compliance",
      ],
    },
  ]

  const galleryImages = [p.image, p.hoverImage, p.image, p.hoverImage]

  function handleAddToCart() {
    addItem({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      category: p.category,
      selectedStorage: effectiveStorage,
      selectedColor: effectiveColor,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/shop" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/shop/catalog" className="hover:text-foreground transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/shop/catalog?cat=${encodeURIComponent(p.category)}`} className="hover:text-foreground transition-colors">
            {p.category}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{p.name}</span>
        </nav>
      </div>

      {/* Product Section */}
      <section className="max-w-7xl mx-auto px-6 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <ProductGallery images={galleryImages} productName={p.name} />

            {/* Clean Hardware Specs Sheet (if present) */}
            {p.specsSheet && Object.keys(p.specsSheet).length > 0 && (
              <div className="border border-border p-6 bg-card">
                <h3 className="font-serif text-lg mb-4 pb-2 border-b border-border">
                  Technical Specifications
                </h3>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  {Object.entries(p.specsSheet).map(([key, val]) => (
                    <div key={key} className="py-1.5 border-b border-border/40">
                      <span className="text-muted-foreground block text-[11px] tracking-wider uppercase">{key}</span>
                      <span className="font-medium text-foreground mt-0.5 block">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="lg:sticky lg:top-32 lg:self-start space-y-8"
          >
            {/* Header */}
            <div className="space-y-3">
              <p className="text-xs tracking-widest text-muted-foreground uppercase">{p.category}</p>
              <h1 className="font-serif text-3xl md:text-4xl">{p.name}</h1>
              <p className="text-2xl font-light">
                ${p.price.toLocaleString()} <span className="text-sm text-muted-foreground">USD</span>
              </p>
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">{p.longDescription}</p>

            {/* Color / Finish Selector */}
            {p.colors.length > 0 && (
              <ColorSelector
                colors={p.colors}
                // @ts-ignore
                selectedColor={effectiveColor}
                onSelect={setSelectedColor}
              />
            )}

            {/* Storage / Configuration Selector */}
            <SizeSelector
              sizes={p.sizes}
              // @ts-ignore
              selectedSize={effectiveStorage}
              onSelect={setSelectedStorage}
            />

            {/* Add to Bag */}
            <motion.button
              onClick={handleAddToCart}
              className={`w-full py-4 text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-3 rounded-none ${
                addedToCart
                  ? "bg-emerald-700 text-white"
                  : "bg-foreground text-background hover:bg-foreground/90"
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <AnimatePresence mode="wait">
                {addedToCart ? (
                  <motion.span
                    key="added"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Added to Bag
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Add to Bag
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                p.warranty || "2-Year Warranty",
                "Same-Day Dispatch",
                "100% Genuine",
              ].map((badge) => (
                <div key={badge} className="border border-border p-2.5 rounded-none">
                  <p className="text-xs text-muted-foreground tracking-wider uppercase text-[10px]">{badge}</p>
                </div>
              ))}
            </div>

            {/* Made In / Warranty Info */}
            <p className="text-xs text-muted-foreground text-center tracking-widest uppercase">
              {p.madeIn || "Factory Certified Hardware"}
            </p>

            {/* Accordion */}
            <ProductDetailsAccordion items={accordionItems} />
          </motion.div>
        </div>
      </section>

      {/* Related Products */}
      <RelatedProducts products={relatedProducts} />

      <PremiumFooter />
    </main>
  )
}
