# فونت دست‌خط فارسی

فعلاً از Vazirmatn (وزیرمتن، از Google Fonts، در style.css لود می‌شه) به‌عنوان
فالبک استفاده شده. برای ظاهر واقعاً دست‌نوشته‌مانند، یکی از فونت‌های زیر رو
دانلود کن (لایسنس رایگان/متن‌باز) و فایل .woff2 رو همین‌جا کپی کن:

- Kereshmeh
- Homa

سپس در `css/style.css` بلاک `@font-face` مربوط به `DiaryHand` رو این‌طور
تغییر بده:

```css
@font-face {
  font-family: 'DiaryHand';
  src: url('../fonts/YourFont.woff2') format('woff2');
}
```
