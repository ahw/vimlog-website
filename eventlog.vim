let g:logdir = '/tmp/'
let g:logfile = 'vimlog.log'

" ...because I can never remember
"
" (nothing) In a function: local to a function; otherwise: global
" |buffer-variable|    b:   Local to the current buffer.
" |window-variable|    w:   Local to the current window.
" |tabpage-variable|   t:   Local to the current tab page.
" |global-variable|    g:   Global.
" |local-variable|     l:   Local to a function.
" |script-variable|    s:   Local to a |:source|'ed Vim script.
" |function-argument|  a:   Function argument (only inside a function).
" |vim-variable|       v:   Global, predefined by Vim.


" Checks if the current filename is g:logfile
if  @% =~ '^.*' . g:logfile
    " Don't run this script if we're editing the log file
    echo "You\'re editing a log file and events will be ignored"
    finish
endif

" let trackevents = ['CursorHold', 'CursorMoved', 'WinEnter', 'WinLeave', 'FocusGained', 'FocusLost', 'VimEnter', 'VimLeave', 'BufEnter', 'BufLeave']
let trackevents = ['VimEnter', 'VimLeave', 'BufEnter', 'BufLeave']

for event in trackevents
    execute 'autocmd ' . event . ' * call Track("' . event . '")'
endfor

unlet event

function Track(event)
    if getftype(@%) == 'file'
        let filename = substitute(@%, '^.*/', '', '')
    else
        let filename = @%
    endif

    if filename == ''
        let filename = 'NO_FILE'
    endif

    let time = strftime('%c', localtime())
    let line = printf('%-12s %-12s  %-11.11s %-.30s', localtime(), time, a:event, filename)

    let escline = shellescape(line)
    call Log(escline, g:logdir . g:logfile)

    "Insert a newline after each VimLeave, for readability.
    if a:event == 'VimLeave'
        call Log(shellescape(""), g:logdir . g:logfile)
    endif

    "silent execute '!echo ' . escline . ' >> ' . g:logdir . g:logfile
endfunction

function Log(msg, logfile)
    silent execute '!echo ' . a:msg . ' >> ' . a:logfile
endfunction
