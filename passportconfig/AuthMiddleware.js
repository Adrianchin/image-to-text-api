const isAuth = (req, res, next) => {
    if (req.isAuthenticated()){
        next()
    } else {
        res.status(401).json({msg:"You are not authorized for this, please log in"})
    }
}

module.exports= {
    isAuth
}