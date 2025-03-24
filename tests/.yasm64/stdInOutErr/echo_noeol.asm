default rel
section .data
    msg: db '1'
    len: equ $-msg

section .text
global main
main:
    mov rax, 1      ; 1 => sys_write syscall
    mov rdi, 1      ; 1 => stdout
    mov rsi, msg    ; get string buffer address
    mov rdx, len    ; get buffer length
    syscall

    mov rax, 60     ; exit program
    mov rdi, 0      ; exit code
    syscall

