# flipCut
FlipCut is a website that takes any image, horizontally flips it, and removes its background.

## Deploying

Save and zip Lambdas
```
npm install
npm run build
# zip dist/ + node_modules together
zip -r function.zip dist/ node_modules/
# upload function.zip in the Lambda console
```

within each directory.

Then upload to the corresponding Lambda.
