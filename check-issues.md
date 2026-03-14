# Issues Found During Review

## Homepage
1. Test categories visible (Test Category 1773467977284, etc.) - need to clean up test data from DB
2. Test book visible (Test Book 1773470705369) - need to clean up test data
3. Category icons are just generic BookOpen icons - could use different icons per category
4. "新书上架" section shows test book first

## Issues to Fix
1. Test categories in DB (Test Category 1773467977284, etc.) - DELETE from DB
2. Test book in DB (Test Book 1773470705369) - DELETE from DB
3. "新书上架" section shows test book with no cover image (big T placeholder)
4. No footer on the page
5. Need to add more books to fill all 6 categories properly
6. Admin needs order status management (ship/complete)
7. Need user profile page
8. Book detail page needs more info fields (ISBN, publisher, pages)

## Verified Working
- Book detail page: shows cover, ISBN, price, stock, description, add-to-cart button - WORKS (cart count went from 3 to 4)
- Cart page: shows items with covers, quantity controls, total calculation - WORKS
- Admin dashboard: shows stats (13 books, 0 orders, 1 user) - WORKS
- Navigation: all links work

## Still Need to Fix/Add
1. Clean test data from DB (test categories + test book)
2. Add more books (currently 12+1 test = need ~20 real books across all categories)
3. Add admin order status management (ship/complete buttons)
4. Add footer component
5. Add user profile page
6. Enrich book detail with publisher, page count info
7. Need to test full checkout->order flow
