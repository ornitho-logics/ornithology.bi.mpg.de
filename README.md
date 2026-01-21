
## Department of Ornithology

This repository holds the source for the public website of the Department of Ornithology in Seewiesen, accessible at [ornithology.bi.mpg.de](http://ornithology.bi.mpg.de) . 

### Credits

This project uses the following software:

* **quarto**: [quarto ](https://quarto.org/) for dynamic document creation.
* **quarto extension**: [quarto fontawesome](https://github.com/quarto-ext/fontawesome) for using fa in quarto.
* **globe.gl**: [globe.gl ](https://globe.gl/) for interactive 3D globes.
* **marked**: [marked ](https://marked.js.org/) for markdown parsing.
* **bootbox**: [bootbox ](https://bootboxjs.com/) for modal windows and dialogs.
* **d3js**: [d3js ](https://d3js.org) for csv parsing and data visualization.
* **index-array-by**: [index-array-by ](https://github.com/jsocke/index-array-by) for array indexing utilities.


### How to contribute

#### Images
 * Images should be `*.webp` files and no larger than 2000px in width.

#### Text
 * Text is contained in  `*.qmd` files and written in markdown. See for example [quarto.org](https://quarto.org/docs/authoring/markdown-basics.html) or [markdownguide.org](https://www.markdownguide.org/cheat-sheet/) for more info.
  

#### Adding a new publication in `/CONTENT/data/publications.bib`
 * check https://www.bibtex.com/g/bibtex-format/ for more info.
 * search and use Google Scholar to export to bib.
 * add new publications on top. 
 * when the entry is an editorial add `group  = {editorial}` to the bib entry.
 * always write `year` as `year = {YYYY}`
 * always add a space after title, author, etc. 
 * if the pdf is made available :
    - add the pdf file to `/CONTENT/biblio/pdfs`
    - add `pdf = {fileName.pdf}`. For `fileName` see _Naming conventions_.
 * check any entry with e.g. [bibtex-tidy](https://flamingtempura.github.io/bibtex-tidy/)

#### Adding a __news__ item in `/CONTENT/news/YYYY/`
  * Create a new `.*qmd` file using a previous file as template. 
  
#### Naming conventions
  * as naming template, use `AuthorKeywordYear`, as in `/CONTENT/biblio/publications.bib`.
  * whenever appropriate the naming template should be applied to:
    -  `publications.bib` entries.
    -  `*.qmd` files in `news`. 
    -  `*.webp` files in `news`.
    -  `*.pdf` files in `biblio/pdfs`.
  

#### Installing the site locally

  __R packages__

  ```r
  c('data.table',
  'glue',
  'bib2df',
  'bibtex',
  'wordcloud',
  'tm',
  'stringr',
  'downlit', 
  'xml2',
  'rnaturalearth',
  'pluralize' # remotes::install_github("hrbrmstr/pluralize")
  ) |>
  sapply(require, character.only = TRUE, quietly = TRUE)

  ```

  __quarto extensions__

```sh
  quarto update extensions

  quarto install extension quarto-ext/fontawesome   --no-prompt
  quarto install extension schochastics/academicons --no-prompt  
  quarto install extension shafayetShafee/bsicons   --no-prompt
  quarto install extension jmgirard/embedpdf        --no-prompt
  quarto install extension quarto-journals/elsevier --no-prompt
  
```