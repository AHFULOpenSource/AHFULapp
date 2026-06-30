from flask import Blueprint, Flask, app, app, current_app, send_from_directory #Import Main Flask application class
import os # Import Function from os to get .env variables
from flask_cors import CORS #Import Main Flask application class
from dotenv import load_dotenv # Load environment variables from .env file
from flask_mail import Mail

#Services/Drivers Imports
from Services.SignInDriver import SignInDriver
from Services.MongoDriver import connect_mongo

#Routes/Blueprints Imports
from APIRoutes.UserRoutes import userRouteBlueprint #[Local] Import User API routes as a Flask Blueprint
from APIRoutes.WorkoutRoutes import workoutRouteBlueprint
from APIRoutes.GymRoutes import gymRouteBlueprint
from APIRoutes.FoodRoutes import foodRouteBlueprint
from APIRoutes.MeasurementRoutes import measurementRouteBlueprint
from APIRoutes.PersonalExRoutes import personalExRouteBlueprint
from APIRoutes.SwaggerRoutes import swaggerUIBlueprint
from APIRoutes.SignInRoutes import signInRouteBlueprint
from APIRoutes.ExerciseRoutes import exerciseRouteBlueprint
from APIRoutes.UserSettingsRoutes import userSettingsBlueprint
from APIRoutes.TokenRoutes import tokenBlueprint
from APIRoutes.TaskRoutes import taskBlueprint
from APIRoutes.SocialRoutes import socialRouteBlueprint
from APIRoutes.VerificationRoutes import verificationRouteBlueprint
from APIRoutes.ChatRoutes import chatRouteBlueprint
from APIRoutes.PromoRoutes import promoBlueprint
from APIRoutes.TemplateRoutes import templateRouteBlueprint

#Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials

#Notification Scheduler
from Services.NotificationScheduler import start_scheduler

# Start mail obj
mail = Mail()

#Main AHFUL APP Backend Entry Point.
def create_app():
    print("----------------------------Let's Get AHFUL!--------------------------------------------")
    # Load environment variables from .env file
    load_dotenv()

    # Create Flask application instance we will use to run the Backend server and handle requests
    #FUN FACT: __name__ is a special variable that is the name of this file.
    app = Flask(__name__)

    #Make an Appwade SignInDriver to reference later
    app.AHFULSignInDriver = SignInDriver(os.getenv("GOOGLE_CLIENT_ID"))
    connect_mongo(app)

    #Initialize Firebase Admin SDK
    cred = credentials.Certificate("./firebaseSecret.json")
    app.AHFULFirebaseDriver = firebase_admin.initialize_app(cred)
    print("Firebase Admin SDK initialized successfully")

    # Configure mail server
    app.config.update(
        MAIL_SERVER="smtp.gmail.com",
        MAIL_PORT=587,
        MAIL_USE_TLS=True,
        MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
        MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
        MAIL_DEFAULT_SENDER=("AHFUL", os.getenv("MAIL_USERNAME"))
    )
    mail.init_app(app)
    app.mail = mail

    #Register App Routes and Blueprints
    #Swagger routes add prefix to match server url
    #This value can be set via the API_PREFIX environment variable. When registering a blueprint with a
    # url_prefix here, Flask will prepend this prefix to the blueprint's own url_prefix (so '/api' + '/AHFULusers' => '/api/AHFULusers').
    AHFULAPI = Blueprint('ProdAPI', __name__, url_prefix='/api')

    AHFULAPI.register_blueprint(userRouteBlueprint)
    AHFULAPI.register_blueprint(workoutRouteBlueprint)
    AHFULAPI.register_blueprint(gymRouteBlueprint)
    AHFULAPI.register_blueprint(foodRouteBlueprint)
    AHFULAPI.register_blueprint(measurementRouteBlueprint)
    AHFULAPI.register_blueprint(personalExRouteBlueprint)
    AHFULAPI.register_blueprint(signInRouteBlueprint)
    AHFULAPI.register_blueprint(exerciseRouteBlueprint)
    AHFULAPI.register_blueprint(userSettingsBlueprint)
    AHFULAPI.register_blueprint(tokenBlueprint)
    AHFULAPI.register_blueprint(taskBlueprint)
    AHFULAPI.register_blueprint(socialRouteBlueprint)
    AHFULAPI.register_blueprint(chatRouteBlueprint)
    AHFULAPI.register_blueprint(verificationRouteBlueprint)
    AHFULAPI.register_blueprint(promoBlueprint)
    AHFULAPI.register_blueprint(templateRouteBlueprint)

    app.register_blueprint(AHFULAPI)
    app.register_blueprint(swaggerUIBlueprint)

    # Enable CORS - includes CloudFront production URL and custom domain
    allowed_origins = [
        'https://ahful.app',
        'https://www.ahful.app'
    ]

    CORS(app, origins=allowed_origins, supports_credentials=True)

    #Start the notification scheduler
    start_scheduler()

    #Print an list of all Route maps on the AHFUL App after startup.
    print(app.url_map)

    #Return AHFUL
    return app


# Create a module-level WSGI application so servers like gunicorn can import
# this module and find the `app` callable (the error reported by gunicorn
# happens when it can't find `app` in the module). Also provide `application`
# alias for servers that expect that name.
app = create_app()
