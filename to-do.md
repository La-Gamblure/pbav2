Contexte : Alors l'appli question actuelle est décomposée en deux parties.  Une partie où il y a un convertisseur de fichiers Excel en fichier JSON dans le fichier Excel Converter HTML.  Et une autre partie qui va être le lecteur dans l'index HTML qui permet d'uploader le fameux JSON afin de le lire ligne par ligne. Bagline représente une action dans un match de fantasy basketball. Dans l'UI, tous les stats sont mis à jour ligne par ligne pour simuler le déroulement d'un match. 

I : On va simplifier le process pour n'avoir à traiter qu'un fichier Excel, donc supprimer l'étape de conversion en JSON, que ça se fasse en back-end, que ce soit indolore pour l'utilisateur. Donc sur index.html, la possibilité de bleder un fichier Excel, du même format qu'on utilise aujourd'hui dans le Excel Converter,  et que ça vienne directement sélectionner pour le match les équipes en présence, leurs logos, leurs couleurs. Jusqu'à présent devait être sélectionnée manuellement à l'aide du menu déroulant.  Le menu déroulant nous permettait de sélectionner les équipes domicile et extérieure et que ça adaptait l'UI en fonction de cela.  Je veux simplifier le tout en plaçant toutes ces étapes par juste un upload du fichier Excel.

II : Voici la dernière étape de conversion en JSON. Il y avait une étape de duplication de la dernière ligne des stats pour que Q4
 0'04" = Q4 0'00" afin que oes stast restent afficher en fin de match et que le compteur affiche 0'00".  Le problème c'est que du coup on va créer un commentaire qui indique par exemple que joueur A a passé à la joueur A.  C'est fait une auto-pass. Donc ça c'est pas possible. Il faut supprimer le fait que ce soit une possession.  On copie tout sauf le fait que ce soit une possession.

 III : transition Quarter

 IV : rapport de match