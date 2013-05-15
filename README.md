Vimlog Website
==============
A simple website for visualizing stuff logged from Vim.

How to Log Stuff From Vim
-------------------------
I have a really hacky Vim script that reacts to `BufEnter`, `BufLeave`,
`VimEnter`, and `VimLeave` events, and logs them to `/tmp/vimlog.log`.

Installing a Vim Script
-----------------------
If you wanted to give my Vim script a whirl, simply put `eventlog.vim` into
the `~/.vim/plugin/` directory. It should "just work" the next time you
start up Vim.

Logging Format
--------------
The `eventlog.vim` script logs lines that look like the following:

    1368573545   Tue 14 May 2013 04:19:05 PM PDT  BufEnter    app.js

The first element is the UNIX timestamp in seconds. Next is the
human-readable timestamp, the event name, and the associated filename. You
could modify it to log in a more machine-friendly way, like JSON or CSV, but
this is what it does for now. The website that this repo describes uses a
regular expression to pull the appropriate data elements from each line.
