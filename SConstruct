"""
Building the xpi file and creating it in the bin dir
"""

import os.path

ext_name = r'fooddiary.xpi'
build_dir = r'..\bin'
xpi = os.path.join(build_dir, ext_name)

# create the build environment
env = Environment()
# specify the build and src dirs (source dir is this dir)
env.VariantDir(build_dir, '.')

# the files in the top level directory
top_files = Split('chrome.manifest fooddiary.sqlite install.rdf LICENCE README')
# get all the (files and) dirs in the chrome sub-directory
chrome = Glob('chrome/*')
defaults = Glob('defaults/*')

# the complete source for the xpi file
src = top_files + chrome + defaults

# xpi file is just a zip file
env.Zip(xpi, src)