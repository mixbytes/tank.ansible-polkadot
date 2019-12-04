[![Build Status](https://travis-ci.org/mixbytes/tank.ansible-polkadot.svg?branch=master)](https://travis-ci.org/mixbytes/tank.ansible-polkadot)

Tank Binding API
================

[tank/playbook.yml](tank/playbook.yml) playbook used by Tank to provision the cluster.

[tank/send_load_profile.yml](tank/send_load_profile.yml) playbook used by Tank to send current load profile js file to all bench nodes.
  * the file is passed via `load_profile_local_file` variable

`bench_present` fact must be set to `True` on all nodes which are capable of running the bench util. 

The bench tool, if installed, must be installed at the `/tool` directory, and must have the following configs:
* `/tool/bench.config.json` (common bench tool config)
* `/tool/blockchain.bench.config.json` (blockchain-specific bench tool config)

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

For local tests Vagrant and VirtualBox are required.

```bash
pip install molecule python-vagrant
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
