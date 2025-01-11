function ErrorText({styleClass, children}){
    return(
        <p className={`text-center bg-error bg-opacity-20 border border-error py-2 rounded-lg ${styleClass}`}>{children}</p>
    )
}

export default ErrorText