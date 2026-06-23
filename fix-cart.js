const fs = require('fs');
const path = 'src/screens/CartScreen.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

const remove = [
  /const subtotal = cartSubtotal\(items\);/,
  /const isFreeDelivery = subtotal >= currentFreeThreshold;/,
  /const delivery = items.length === 0 \? 0 : \(isFreeDelivery \? 0 : currentDeliveryFee\);/,
  /const discountAmount = promoDiscount > 0 \? \(subtotal \* promoDiscount\) \/ 100 : 0;/,
  /const total = subtotal \+ delivery - discountAmount;/,
  /const remaining = currentFreeThreshold - subtotal;/,
  /const progress = Math.min\(\(subtotal \/ currentFreeThreshold\) \* 100, 100\);/,
  /const handleAdd = \(\) => \{/,
  /go\(\{ name: ['"]checkout['"] \}\);/,
  /^\s*\};\s*$/
];

const result = lines.filter(line => !remove.some(re => re.test(line)));
fs.writeFileSync(path, result.join('\n'));
console.log('Fixed CartScreen.tsx - old declarations removed');
