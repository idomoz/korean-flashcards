## Workflow to add a new book

1. Convert PDFs to text using https://www.youpdf.com/pdf-to-txt.html
2. Save the converted text files in ../texts
2. Add new txt files references to ./convert-to-csv.js
3. Run `node scripts/convert-to-csv.js` to generate CSV files
4. Copy the new combined csv file to src/data folder
5. Update ../src/data/vocabulary.js with new combined csv file reference