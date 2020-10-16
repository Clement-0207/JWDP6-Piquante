const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
    const sauceObjet = JSON.parse(req.body.sauce);
    delete sauceObjet._id;
    const sauce = new Sauce({
        ...sauceObjet,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    });
    sauce.save()
        .then(() => res.status(201).json({ message: 'Objet enregistré !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.modifySauce = (req, res, next) => {
    const sauceObjet = req.file ?
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        } : { ...req.body };
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.updateOne({ _id: req.params.id }, { ...sauceObjet, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Objet modifié !' }))
                    .catch(error => res.status(400).json({ error }));
            })
        })
        .catch(error => res.status(400).json({ error }));

};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Objet supprimé !' }))
                    .catch(error => res.status(400).json({ error }));
            })
        })
        .catch(error => res.status(500).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
};

exports.getAllSauce = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
};

const addLike = (sauce, userId) => {
    sauce.likes += 1;//ajouter 1 au like
    sauce.usersLiked.push(userId);
};

const removeLike = (sauce, userId) => {
    sauce.likes -= 1;//retire 1 au like
    sauce.usersLiked.splice(sauce.usersLiked.indexOf(userId), 1);
};

const addDislike = (sauce, userId) => {
    sauce.dislikes += 1;
    sauce.usersDisliked.push(userId);
};

const removeDislike = (sauce, userId) => {
    sauce.dislikes -= 1;
    sauce.usersDisliked.splice(sauce.usersDisliked.indexOf(userId), 1);
};

const findInArray = (array, userId) => {
    return array.indexOf(userId) !== -1;//pour trouver si la valeur est dans le tableau "booléens"
};

exports.likeSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            //dispatcher les 3 cas (if like-dislike-unlike)
            const like = req.body.like;
            const userId = req.body.userId;
            if (like === 1) {
                //si like déjà fait, ne pas autoriser à refaire
                if (!findInArray(sauce.usersLiked, userId)) {
                    //si dislike déjà fait, désactiver dislike et activer like
                    if (findInArray(sauce.usersDisliked, userId)) {
                        removeDislike(sauce, userId);
                    }
                    //si like, augmenter la variable likes et ajouter user id dans le tableau 
                    addLike(sauce, userId);
                }
            }
            if (like === -1) {
                //si dislike déjà fait, ne pas autoriser à refaire
                if (!findInArray(sauce.usersDisliked, userId)) {
                    //si like déjà fait, désactiver like et activer dislike
                    if (findInArray(sauce.usersLiked, userId)) {
                        removeLike(sauce, userId);
                    }
                    //si like ne pas augmenter la variable dislikes et ajouter user id dans le tableau
                    addDislike(sauce, userId);
                }
            }
            if (like === 0) {
                //si dans le cas unlike, trouver le user Id dans l'un des 2 tableaux, le retirer et décrémenter la variable associés
                //si re-like alors -1
                if (findInArray(sauce.usersLiked, userId)) {
                    removeLike(sauce, userId);
                }
                //si re-dislike alors -1
                if (findInArray(sauce.usersDisliked, userId)) {
                    removeDislike(sauce, userId);
                }
            }

            const updatedSauce = {
                likes: sauce.likes,
                dislikes: sauce.dislikes,
                usersLiked: sauce.usersLiked,
                usersDisliked: sauce.usersDisliked
            }
            Sauce.updateOne({ _id: req.params.id }, { ...updatedSauce, _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Objet modifié !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(400).json({ error }));
};



