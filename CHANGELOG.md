<a name="1.5.2"></a>
### 1.5.2 (2017-03-30)


#### Bug Fixes

* **output:**  make sure to also prefix css for ie10 :-( ([2f5945f3](2f5945f3))



<a name="1.5.1"></a>
### 1.5.1 (2017-03-29)


#### Bug Fixes

* **output:**  properly add global prefix to @rules ([b1f22bab](b1f22bab))



<a name="1.5.0"></a>
## 1.5.0 (2017-03-29)


#### Features

* **output:**  Add support to prefix EVERY selector ([3c69f83d](3c69f83d))



<a name="1.4.0"></a>
## 1.4.0 (2016-09-29)


#### Features

* **syntax:**  generate reisy css from json definiton ([f2c047aa](f2c047aa))




1.3.1 / 2016-09-01
==================

  * fix closing parens being swollowed after interpolation

1.3.0 / 2016-08-31
==================

  * build a consumable parser.js file

1.2.2 / 2016-08-30
==================

  * support selector references in interpolation

1.2.2 / 2016-08-25
==================

  * support selector placeholders in arbitrary position

1.2.1 / 2016-08-18
==================

  * switch to inline-style-prefixer/static (#2)
  * small cleanups / bumping dependencies

1.2.0 / 2016-07-08
==================

  * log errors, but do not throw (#5)
  * reorganize files, add pretty printing setting (#4)
  * fix nesting when parent has multiple selectors

1.1.0 / 2016-07-07
==================

  * add a `reisy` CLI command (#6)
  * support @font-face definitions inside the css parser (#1)
