[![Build Status](https://travis-ci.org/mixbytes/tank.ansible-polkadot.svg?branch=master)](https://travis-ci.org/mixbytes/tank.ansible-polkadot)

Role Name
=========

tank_polkadot

Requirements
------------


Role Variables
--------------


Dependencies
------------


Example Playbook
----------------

License
-------

Apache 2.0

Author Information
------------------

[MixBytes](https://mixbytes.io).

Development
===========

Dependencies
------------

Python 2.7+ is required.

```bash
pip install molecule
```

Tests
-----

Quick linter test

```bash
molecule lint -s monitoring
```

Vagrant+virtualbox based local test

```bash
molecule test -s monitoring
```
