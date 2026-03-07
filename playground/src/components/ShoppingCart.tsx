import { useState } from 'react'
import { useAgentContext } from '../../../src/hooks/useAgentContext'

const PRODUCTS = ['Laptop', 'Mouse', 'Keyboard', 'Monitor', 'Headphones']

export const ShoppingCart = () => {
  const [items, setItems] = useState<string[]>([])
  const [lastSnapshot, setLastSnapshot] = useState<unknown>(null)

  useAgentContext(
    'shopping_cart',
    'Current items in the shopping cart and their count',
    () => ({ items, count: items.length }),
  )

  const toggle = (product: string) => {
    setItems(prev =>
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product],
    )
  }

  const simulate = () => {
    setLastSnapshot({ items, count: items.length })
  }

  return (
    <div className="border border-gray-200 rounded p-3">
      <div className="mb-3">
        <strong>Cart</strong> — tick items to add them, then let the agent read it:
      </div>

      <div className="flex gap-4 flex-wrap mb-3">
        {PRODUCTS.map(product => (
          <label key={product} className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={items.includes(product)}
              onChange={() => toggle(product)}
            />
            {product}
          </label>
        ))}
      </div>

      <div className="flex gap-3 items-center">
        <button
          className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer"
          onClick={simulate}
        >
          ▶ simulate agent read
        </button>
        <span className="text-gray-500 text-sm">
          {items.length === 0 ? 'cart is empty' : `${items.length} item(s) in cart`}
        </span>
      </div>

      {lastSnapshot !== null && (
        <div className="mt-3 text-sm">
          Agent saw: <code>{JSON.stringify(lastSnapshot)}</code>
        </div>
      )}
    </div>
  )
}
