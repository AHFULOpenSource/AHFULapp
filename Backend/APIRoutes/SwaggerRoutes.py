from flask import jsonify                             # Use Flask to import Python Code as JSON
from flask_swagger_ui import get_swaggerui_blueprint  #Import swagger from Python Package.

swaggerAHFULDocsURL = '/api/APIDocs'                    # full path, leading slash     # URL for exposing Swagger UI
configDocURL = '/api/APIDocs/swagger.json'               #URL for the Backend Configuration for the UI
appNameconfig = {
    'app_name': "AHFUL Project API",
    'tagsSorter': 'alpha',
    'operationsSorter': 'method'
}                 #Header App Name to display in UI

swaggerUIBlueprint = get_swaggerui_blueprint(
    swaggerAHFULDocsURL,
    configDocURL,
    config=appNameconfig        # ← also needs to be a keyword arg: config=
)

# ── GET Route to Return the Local Swagger API Config ────────────────────────────────────────────────────────────
@swaggerUIBlueprint.route('/swagger.json', methods=["GET"])
def swagger_json():
    return jsonify(swaggerConfig)

#All Local Swagger API Docs Config is setup here:
swaggerConfig = {
  "openapi": "3.0.3",
  "info": {
    "title": "AHFUL Users API",
    "version": "1.0.0"
  },
  "servers": [
      # Changed for local development
    { "url": "/api" }
  ],
  
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "Token"
      },
      "userIdHeader": {
        "type": "apiKey",
        "in": "header",
        "name": "X-User-Id"
      }
    }
  },

  "paths": {

"/AHFULusers/": {
 "get": {
  "summary": "Get all users (Admin)",
  "tags": ["Users"],
  "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
  "responses": {
   "200": {
    "description": "All users returned",
    "content": {
     "application/json": {
      "schema": {
       "type": "array",
       "items": {
        "type": "object",
        "properties": {
         "_id": { "type": "string", "example": "69af32adf43f4d34477c849d" },
         "name": { "type": "string", "example": "Elijah Turany" },
         "email": { "type": "string", "format": "email" },
         "picture": { "type": "string" },
         "last_login_time": { "type": "integer" },
         "last_login_expire": { "type": "integer" },
         "magic_bits": { "type": "string" },
         "roles": {
          "type": "array",
          "items": { "type": "string" },
          "example": ["User"]
         },
         "deactivated": { "type": "boolean", "example": False },
         "_testObject": { "type": "string" },
         "updated_at": { "type": "string", "format": "date-time" }
        },
        "required": ["_id", "email", "name", "roles", "updated_at"]
       }
      }
     }
    }
   }
  }
 }
},

"/AHFULusers/{email}": {
 "get": {
  "summary": "Get user by email (Admin)",
  "tags": ["Users"],
  "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
  "parameters": [
   {
    "name": "email",
    "in": "path",
    "required": True,
    "schema": { "type": "string", "format": "email" }
   }
  ],
  "responses": {
   "200": {
    "description": "User found",
    "content": {
     "application/json": {
      "schema": {
       "type": "object",
       "properties": {
        "_id": { "type": "string" },
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "picture": { "type": "string" },
        "last_login_time": { "type": "integer" },
        "last_login_expire": { "type": "integer" },
        "magic_bits": { "type": "string" },
        "roles": { "type": "array", "items": { "type": "string" } },
        "deactivated": { "type": "boolean" },
        "_testObject": { "type": "string" },
        "updated_at": { "type": "string", "format": "date-time" }
       },
       "required": ["_id", "email", "name", "roles", "updated_at"]
      }
     }
    }
   },
   "404": {
    "description": "User not found",
    "content": {
     "application/json": {
      "schema": {
       "type": "object",
       "properties": { "error": { "type": "string" } }
      }
     }
    }
   }
  }
 }
},

"/AHFULusers/id/{id}": {
 "get": {
  "summary": "Get user by id (User or Dev/Admin)",
  "tags": ["Users"],
  "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
  "parameters": [
   {
    "name": "id",
    "in": "path",
    "required": True,
    "schema": { "type": "string" }
   }
  ],
  "responses": {
   "200": {
    "description": "User found",
    "content": {
     "application/json": {
      "schema": {
       "type": "object",
       "properties": {
        "_id": { "type": "string" },
        "name": { "type": "string" },
        "email": { "type": "string" },
        "picture": { "type": "string" },
        "last_login_time": { "type": "integer" },
        "last_login_expire": { "type": "integer" },
        "magic_bits": { "type": "string" },
        "roles": { "type": "array", "items": { "type": "string" } },
        "deactivated": { "type": "boolean" },
        "_testObject": { "type": "string" },
        "updated_at": { "type": "string", "format": "date-time" }
       },
       "required": ["_id", "email", "name", "roles", "updated_at"]
      }
     }
    }
   },
   "404": {
    "description": "User not found",
    "content": {
     "application/json": {
      "schema": {
       "type": "object",
       "properties": { "error": { "type": "string" } }
      }
     }
    }
   }
  }
 }
},

"/AHFULusers/add/role/id/": {
 "post": {
  "summary": "Add role to user by id (Admin)",
  "tags": ["Users"],
  "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
  "requestBody": {
   "required": True,
   "content": {
    "application/json": {
     "schema": {
      "type": "object",
      "properties": {
       "user_id": { "type": "string" },
       "adder_id": { "type": "string" },
       "role": { "type": "string" }
      },
      "required": ["user_id", "adder_id", "role"]
     }
    }
   }
  },
  "responses": {
   "200": {
    "description": "Role added; updated user returned",
    "content": {
     "application/json": {
      "schema": {
       "type": "object",
       "properties": {
        "_id": { "type": "string" },
        "email": { "type": "string" },
        "roles": { "type": "array", "items": { "type": "string" } },
        "updated_at": { "type": "string", "format": "date-time" }
       }
      }
     }
    }
   },
   "404": {
    "description": "User not found or validation error",
    "content": {
     "application/json": {
      "schema": {
       "type": "object",
       "properties": { "error": { "type": "string" } }
      }
     }
    }
   }
  }
 }
},

"/AHFULusers/add/role/email/": {
 "post": {
  "summary": "Add role to user by email (Admin)",
  "tags": ["Users"],
  "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
  "requestBody": {
   "required": True,
   "content": {
    "application/json": {
     "schema": {
      "type": "object",
      "properties": {
       "user_email": { "type": "string", "format": "email" },
       "adder_id": { "type": "string" },
       "role": { "type": "string" }
      },
      "required": ["user_email", "adder_id", "role"]
     }
    }
   }
  },
  "responses": {
   "200": {
    "description": "Role added; updated user returned",
    "content": {
     "application/json": {
      "schema": {
       "type": "object",
       "properties": {
        "_id": { "type": "string" },
        "email": { "type": "string" },
        "roles": { "type": "array", "items": { "type": "string" } },
        "updated_at": { "type": "string", "format": "date-time" }
       }
      }
     }
    }
   },
   "404": {
    "description": "User not found or validation error",
    "content": {
     "application/json": {
      "schema": {
       "type": "object",
       "properties": { "error": { "type": "string" } }
      }
     }
    }
   }
  }
 }
},

"/AHFULusers/remove/role/id/": {
 "post": {
  "summary": "Remove role from user by id (Admin)",
  "tags": ["Users"],
  "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
  "requestBody": {
   "required": True,
   "content": {
    "application/json": {
     "schema": {
      "type": "object",
      "properties": {
       "user_id": { "type": "string" },
       "remover_id": { "type": "string" },
       "role": { "type": "string" }
      },
      "required": ["user_id", "remover_id", "role"]
     }
    }
   }
  },
  "responses": {
   "200": {
    "description": "Role removed; updated user returned",
    "content": {
     "application/json": {
      "schema": {
       "type": "object",
       "properties": {
        "_id": { "type": "string" },
        "email": { "type": "string" },
        "roles": { "type": "array", "items": { "type": "string" } },
        "updated_at": { "type": "string", "format": "date-time" }
       }
      }
     }
    }
   },
   "404": {
    "description": "User not found or validation error",
    "content": {
     "application/json": {
      "schema": {
       "type": "object",
       "properties": { "error": { "type": "string" } }
      }
     }
    }
   }
  }
 }
},

"/AHFULusers/remove/role/email/": {
 "post": {
  "summary": "Remove role from user by email (Admin)",
  "tags": ["Users"],
  "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
  "requestBody": {
   "required": True,
   "content": {
    "application/json": {
     "schema": {
      "type": "object",
      "properties": {
       "user_email": { "type": "string" },
       "remover_id": { "type": "string" },
       "role": { "type": "string" }
      },
      "required": ["user_email", "remover_id", "role"]
     }
    }
   }
  },
  "responses": {
   "200": {
    "description": "Role removed; updated user returned",
    "content": {
     "application/json": {
      "schema": {
       "type": "object",
       "properties": {
        "_id": { "type": "string" },
        "email": { "type": "string" },
        "roles": { "type": "array", "items": { "type": "string" } },
        "updated_at": { "type": "string", "format": "date-time" }
       }
      }
     }
    }
   },
   "404": {
    "description": "User not found or validation error",
    "content": {
     "application/json": {
      "schema": {
       "type": "object",
       "properties": { "error": { "type": "string" } }
      }
     }
    }
   }
  }
 }
},

"/AHFULusers/deactivate/id/": {
 "post": {
  "summary": "Deactivate user by id (Admin)",
  "tags": ["Users"],
  "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
  "requestBody": {
   "required": True,
   "content": {
    "application/json": {
     "schema": {
      "type": "object",
      "properties": {
       "user_id": { "type": "string" },
       "deactivator_id": { "type": "string" }
      },
      "required": ["user_id", "deactivator_id"]
     }
    }
   }
  },
  "responses": {
   "200": {
    "description": "User deactivated; updated user returned",
    "content": {
     "application/json": {
      "schema": {
       "type": "object",
       "properties": {
        "_id": { "type": "string" },
        "email": { "type": "string" },
        "roles": { "type": "array", "items": { "type": "string" } },
        "deactivated": { "type": "boolean", "example": True },
        "updated_at": { "type": "string", "format": "date-time" }
       }
      }
     }
    }
   },
   "404": {
    "description": "User not found or validation error",
    "content": {
     "application/json": {
      "schema": {
       "type": "object",
       "properties": { "error": { "type": "string" } }
      }
     }
    }
   }
  }
 }
},

"/AHFULverify/verify/email/user_id/": {
  "post": {
    "summary": "Verify user email by id (User or Dev/Admin)",
    "description": "Starts email verification process for email on user obj",
    "tags": ["Verify"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "requestBody": {
      "required": True,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "properties": {
              "user_id": {
                "type": "string",
                "example": "69af32adf43f4d34477c849d"
              }
            },
            "required": ["user_id"]
          }
        }
      }
    },
    "responses": {
      "200": {
        "description": "Email successfully verified or already verified",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "message": {
                  "type": "string",
                  "example": "Email successfully verified"
                }
              }
            }
          }
        }
      },
      "400": {
        "description": "Invalid request or email not verifiable",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "error": {
                  "type": "string",
                  "example": "user_id is required"
                }
              }
            }
          }
        }
      },
      "404": {
        "description": "User not found",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "error": {
                  "type": "string",
                  "example": "User not found"
                }
              }
            }
          }
        }
      }
    }
  }
},

"/AHFULverify/verify/phone/user_id/": {
  "post": {
    "summary": "Verify user phone number by id (User or Dev/Admin)",
    "description": "Starts email verification process for email on user obj",
    "tags": ["Verify"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "requestBody": {
      "required": True,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "properties": {
              "user_id": {
                "type": "string",
                "example": "69af32adf43f4d34477c849d"
              }
            },
            "required": ["user_id"]
          }
        }
      }
    },
    "responses": {
      "200": {
        "description": "Phone number verified successfully or already verified",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "message": {
                  "type": "string",
                  "example": "Phone number verified successfully"
                }
              }
            }
          }
        }
      },
      "400": {
        "description": "Invalid request or verification failed",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "error": {
                  "type": "string",
                  "example": "user_id is required"
                }
              }
            }
          }
        }
      },
      "404": {
        "description": "User not found",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "error": {
                  "type": "string",
                  "example": "User not found"
                }
              }
            }
          }
        }
      }
    }
  }
},

"/AHFULverify/deverify/user_id/": {
  "post": {
    "summary": "Disable user verification by user id (Admin)",
    "description": "Disables a user's email or phone verification status.",
    "tags": ["Verify"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "requestBody": {
      "required": True,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "properties": {
              "user_id": {
                "type": "string",
                "example": "69af32adf43f4d34477c849d"
              },
              "type": {
                "type": "string",
                "enum": ["email", "phone"],
                "example": "email"
              }
            },
            "required": ["user_id", "type"]
          }
        }
      }
    },
    "responses": {
      "200": {
        "description": "Verification disabled; updated user returned",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "message": {
                  "type": "string",
                  "example": "email verification disabled"
                },
                "user": {
                  "type": "object",
                  "properties": {
                    "_id": { "type": "string" },
                    "email_verified": {
                      "type": "boolean",
                      "example": False
                    },
                    "phone_verified": {
                      "type": "boolean",
                      "example": True
                    },
                    "updated_at": {
                      "type": "string",
                      "format": "date-time"
                    }
                  }
                }
              }
            }
          }
        }
      },
      "400": {
        "description": "Invalid request or verification type",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "error": {
                  "type": "string",
                  "example": "type must be 'email' or 'phone'"
                }
              }
            }
          }
        }
      },
      "404": {
        "description": "User not found",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "error": {
                  "type": "string",
                  "example": "User not found"
                }
              }
            }
          }
        }
      }
    }
  }
},

"/AHFULverify/verify/email/{token_id}/{token}": {
  "get": {
    "summary": "Confirm email verification token (Public)",
    "description": "Validates an email verification token, enables email verification, deletes the token, and redirects to the frontend result page.",
    "tags": ["Verify"],
    "parameters": [
      {
        "name": "token_id",
        "in": "path",
        "required": True,
        "schema": { "type": "string" },
        "description": "Verification token ObjectId"
      },
      {
        "name": "token",
        "in": "path",
        "required": True,
        "schema": { "type": "string" },
        "description": "Verification token value"
      }
    ],
    "responses": {
      "302": {
        "description": "Redirect to email verification frontend",
        "headers": {
          "Location": {
            "schema": {
              "type": "string",
              "example": "https://ahful.app/EmailVerification?status=success"
            }
          }
        }
      }
    }
  }
},

"/AHFULverify/verify/phone/{token_id}/{token}": {
  "get": {
    "summary": "Confirm phone verification token (Public)",
    "description": "Validates a phone verification token, enables phone verification, deletes the token, and redirects to the frontend result page.",
    "tags": ["Verify"],
    "parameters": [
      {
        "name": "token_id",
        "in": "path",
        "required": True,
        "schema": { "type": "string" }
      },
      {
        "name": "token",
        "in": "path",
        "required": True,
        "schema": { "type": "string" }
      }
    ],
    "responses": {
      "302": {
        "description": "Redirect to phone verification frontend",
        "headers": {
          "Location": {
            "schema": {
              "type": "string",
              "example": "https://ahful.app/PhoneVerification?status=success"
            }
          }
        }
      }
    }
  }
},

"/AHFULpersonalEx/": {
  "get": {
    "summary": "Get all personal exercises (Dev/Admin)",
    "tags": ["PersonalEx"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "responses": {
      "200": {
        "description": "A list of all personal exercises",
        "content": {
          "application/json": {
            "schema": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "_id":        { "type": "string" },
                  "exercise_id":{ "type": "string" },
                  "workout_id": { "type": "string" },
                  "user_id":    { "type": "string" },
                  "reps":      { "type": "string" },
                  "sets":      { "type": "string" },
                  "weight":    { "type": "string" },
                  "duration":  { "type": "integer" },
                  "distance":  { "type": "string" },
                  "complete":  { "type": "boolean" }
                }
              }
            }
          }
        }
      },
      "500": {
        "description": "Server error",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": { "error": { "type": "string" } }
            }
          }
        }
      }
    }
  }
},

"/AHFULpersonalEx/{user_id}": {
  "get": {
    "summary": "Get all personal exercises for a specific user (User or Dev/Admin)",
    "tags": ["PersonalEx"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "parameters": [
      {
        "name": "user_id",
        "in": "path",
        "required": True,
        "description": "User ObjectId",
        "schema": { "type": "string" }
      }
    ],
    "responses": {
      "200": {
        "description": "List of personal exercises (empty list if none exist)",
        "content": {
          "application/json": {
            "schema": {
              "type": "array",
              "items": { "$ref": "#/components/schemas/PersonalEx" }
            }
          }
        }
      },
      "400": {
        "description": "Invalid user_id",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      },
      "500": {
        "description": "Server error",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      }
    }
  }
},

"/AHFULpersonalEx/workout/{workout_id}": {
  "get": {
    "summary": "Get all personal exercises for a specific workout",
    "tags": ["PersonalEx"],
    "parameters": [
      {
        "name": "workout_id",
        "in": "path",
        "required": True,
        "description": "Workout ObjectId",
        "schema": { "type": "string" }
      }
    ],
    "responses": {
      "200": {
        "description": "List of personal exercises (empty array if none exist)",
        "content": {
          "application/json": {
            "schema": {
              "type": "array",
              "items": { "$ref": "#/components/schemas/PersonalEx" }
            }
          }
        }
      },
      "400": {
        "description": "Invalid workout_id",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      },
      "500": {
        "description": "Server error",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      }
    }
  }
},

"/AHFULpersonalEx/id/{id}": {
  "get": {
    "summary": "Get a single personal exercise by id",
    "tags": ["PersonalEx"],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": True,
        "description": "PersonalEx ObjectId",
        "schema": { "type": "string" }
      }
    ],
    "responses": {
      "200": {
        "description": "Personal exercise found",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/PersonalEx" }
          }
        }
      },
      "404": {
        "description": "Personal exercise not found",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      },
      "400": {
        "description": "Invalid id format",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      }
    }
  }
},

"/AHFULpersonalEx/create": {
  "post": {
    "summary": "Create a personal exercise (Logged in)",
    "tags": ["PersonalEx"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "requestBody": {
      "required": True,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "required": ["user_id", "exercise_id", "workout_id"],
            "properties": {
              "user_id":     { "type": "string" },
              "exercise_id": { "type": "string" },
              "workout_id":  { "type": "string" },
              "reps":        { "type": "string" },
              "sets":        { "type": "string" },
              "weight":      { "type": "string" },
              "duration":    { "type": "integer" },
              "distance":    { "type": "string" },
              "complete":    { "type": "boolean" },
              "template":    { "type": "boolean" }
            }
          }
        }
      }
    },
    "responses": {
      "201": {
        "description": "Personal exercise created",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "personal_ex_id": { "type": "string" },
                "message": { "type": "string" }
              }
            }
          }
        }
      },
      "400": {
        "description": "Invalid input or missing fields",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      }
    }
  }
},

"/AHFULpersonalEx/update/{personal_ex_id}": {
  "put": {
    "summary": "Update a personal exercise",
    "tags": ["PersonalEx"],
    "parameters": [
      {
        "name": "personal_ex_id",
        "in": "path",
        "required": True,
        "description": "Personal exercise ObjectId",
        "schema": { "type": "string" }
      }
    ],
    "requestBody": {
      "required": True,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "properties": {
              "reps":     { "type": "string" },
              "sets":     { "type": "string" },
              "weight":   { "type": "string" },
              "duration": { "type": "integer" },
              "distance": { "type": "string" },
              "complete": { "type": "boolean" }
            },
            "additionalProperties": False
          }
        }
      }
    },
    "responses": {
      "200": {
        "description": "Personal exercise updated",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "message": { "type": "string" },
                "personal_ex": { "$ref": "#/components/schemas/PersonalEx" }
              }
            }
          }
        }
      },
      "400": {
        "description": "Invalid request or no allowed fields provided",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      },
      "404": {
        "description": "Personal exercise not found",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      }
    }
  }
},

"/AHFULpersonalEx/delete/{personal_ex_id}": {
  "delete": {
    "summary": "Delete a personal exercise",
    "tags": ["PersonalEx"],
    "parameters": [
      {
        "name": "personal_ex_id",
        "in": "path",
        "required": True,
        "description": "Personal exercise ObjectId",
        "schema": { "type": "string" }
      }
    ],
    "responses": {
      "200": {
        "description": "Personal exercise deleted",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "message": { "type": "string" },
                "personal_ex_id": { "type": "string" }
              }
            }
          }
        }
      },
      "404": {
        "description": "Personal exercise not found",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      },
      "400": {
        "description": "Invalid ID format",
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/Error" }
          }
        }
      }
    }
  }
},

"/AHFULexercises/": {
    "get": {
      "summary": "Get first page of exercises, internal + external (Logged in)",
      "tags": ["Exercises"],
      "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
      "responses": {
        "200": {
          "description": "List of exercises",
          "content": {
            "application/json": {
              "schema": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "_id": { "type": "string", "example": "69b229e944f2bd681112ca89" },
                    "name": { "type": "string", "example": "AHFUL wrist circles" },
                    "gifUrl": {
                      "type": "string",
                      "example": "https://static.exercisedb.dev/media/2zNKRUB.gif"
                    },
                    "targetMuscles": {
                      "type": "array",
                      "items": { "type": "string" }
                    },
                    "bodyParts": {
                      "type": "array",
                      "items": { "type": "string" }
                    },
                    "equipments": {
                      "type": "array",
                      "items": { "type": "string" }
                    },
                    "secondaryMuscles": {
                      "type": "array",
                      "items": { "type": "string" }
                    },
                    "instructions": {
                      "type": "array",
                      "items": { "type": "string" }
                    }
                  }
                }
              }
            }
          }
        },
        "500": {
          "description": "Server error",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": { "error": { "type": "string" } }
              }
            }
          }
        }
      }
    },
    "post": {
      "summary": "Get next or previous page of exercises (Logged In)",
      "tags": ["Exercises"],
      "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
      "parameters": [
        {
          "name": "search",
          "in": "query",
          "required": True,
          "schema": { "type": "string", "enum": ["next", "prev"] }
        }
      ],
      "requestBody": {
        "required": True,
        "content": {
          "application/json": {
            "schema": { "type": "object" }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Paged exercise results",
          "content": {
            "application/json": {
              "schema": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "_id": { "type": "string" },
                    "name": { "type": "string" },
                    "gifUrl": { "type": "string" },
                    "targetMuscles": { "type": "array", "items": { "type": "string" } },
                    "bodyParts": { "type": "array", "items": { "type": "string" } },
                    "equipments": { "type": "array", "items": { "type": "string" } },
                    "secondaryMuscles": { "type": "array", "items": { "type": "string" } },
                    "instructions": { "type": "array", "items": { "type": "string" } }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

"/AHFULexercises/id/{exercise_id}": {
  "get": {
    "summary": "Get exercise by id (internal or external)",
    "tags": ["Exercises"],
    "parameters": [
      {
        "name": "exercise_id",
        "in": "path",
        "required": True,
        "schema": { "type": "string" }
      }
    ],
    "responses": {
      "200": {
        "description": "Exercise found",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "_id": { "type": "string" },
                "name": { "type": "string" },
                "gifUrl": { "type": "string" },
                "targetMuscles": { "type": "array", "items": { "type": "string" } },
                "bodyParts": { "type": "array", "items": { "type": "string" } },
                "equipments": { "type": "array", "items": { "type": "string" } },
                "secondaryMuscles": { "type": "array", "items": { "type": "string" } },
                "instructions": { "type": "array", "items": { "type": "string" } }
              }
            }
          }
        }
      },
      "404": {
        "description": "Exercise not found",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": { "error": { "type": "string" } }
            }
          }
        }
      }
    }
  }
},

"/AHFULexercises/search": {
  "get": {
    "summary": "Search exercises by name (Logged in)",
    "tags": ["Exercises"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "parameters": [
      {
        "name": "search",
        "in": "query",
        "required": True,
        "schema": { "type": "string" }
      }
    ],
    "responses": {
      "200": {
        "description": "Search results",
        "content": {
          "application/json": {
            "schema": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "_id": { "type": "string" },
                  "name": { "type": "string" },
                  "gifUrl": { "type": "string" },
                  "targetMuscles": { "type": "array", "items": { "type": "string" } },
                  "bodyParts": { "type": "array", "items": { "type": "string" } },
                  "equipments": { "type": "array", "items": { "type": "string" } },
                  "secondaryMuscles": { "type": "array", "items": { "type": "string" } },
                  "instructions": { "type": "array", "items": { "type": "string" } }
                }
              }
            }
          }
        }
      }
    }
  }
},

"/AHFULexercises/create/": {
  "post": {
    "summary": "Create a new internal exercise (Logged in)",
    "tags": ["Exercises"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "requestBody": {
      "required": True,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "required": ["name"],
            "properties": {
              "name": { "type": "string" },
              "gifUrl": { "type": "string" },
              "targetMuscles": { "type": "array", "items": { "type": "string" } },
              "bodyParts": { "type": "array", "items": { "type": "string" } },
              "equipments": { "type": "array", "items": { "type": "string" } },
              "secondaryMuscles": { "type": "array", "items": { "type": "string" } },
              "instructions": {
                "type": "string",
                "description": "Newline-separated instructions; stored as array"
              }
            }
          }
        }
      }
    },
    "responses": {
      "201": {
        "description": "Exercise successfully created",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "exercise_id": { "type": "string" },
                "message": { "type": "string" }
              }
            }
          }
        }
      }
    }
  }
},

"/AHFULexercises/delete/{exercise_id}": {
  "delete": {
    "summary": "Delete internal exercise by id (Dev/Admin)",
    "tags": ["Exercises"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "parameters": [
      {
        "name": "exercise_id",
        "in": "path",
        "required": True,
        "schema": { "type": "string" }
      }
    ],
    "responses": {
      "200": {
        "description": "Exercise deleted",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "message": { "type": "string" }
              }
            }
          }
        }
      },
      "404": {
        "description": "Exercise not found",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": { "error": { "type": "string" } }
            }
          }
        }
      }
    }
  }
},

"/AHFULexercises/metadata": {
  "get": {
    "summary": "Get metadata for first exercise page (Logged in)",
    "tags": ["Exercises"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "responses": {
      "200": {
        "description": "Exercise metadata",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "additionalProperties": True
            }
          }
        }
      }
    }
  },
  "post": {
    "summary": "Get metadata for next or previous page",
    "tags": ["Exercises"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "parameters": [
      {
        "name": "search",
        "in": "query",
        "required": True,
        "schema": { "type": "string", "enum": ["next", "prev"] }
      }
    ],
    "requestBody": {
      "required": True,
      "content": {
        "application/json": {
          "schema": { "type": "object" }
        }
      }
    },
    "responses": {
      "200": {
        "description": "Metadata response",
        "content": {
          "application/json": {
            "schema": { "type": "object", "additionalProperties": True }
          }
        }
      }
    }
  }
},

"/AHFULworkouts/": {
    "get": {
      "summary": "Get all workouts (Admin)",
      "tags": ["Workout"],
      "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
      "responses": {
        "200": {
          "description": "List of all workouts",
          "content": {
            "application/json": {
              "schema": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "_id": { "type": "string" },
                    "user_id": { "type": "string" },
                    "gym_id": { "type": "string" },
                    "title": { "type": "string" },
                    "startTime": { "type": "integer" },
                    "endTime": { "type": "integer" },
                    "template": { "type": "boolean", "example": False }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

"/AHFULworkouts/{user_id}": {
  "get": {
    "summary": "Get workouts by user id (User or Dev/Admin)",
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "tags": ["Workout"],
    "parameters": [
      {
        "name": "user_id",
        "in": "path",
        "required": True,
        "schema": { "type": "string" }
      }
    ],
    "responses": {
      "200": {
        "description": "Workouts for the user",
        "content": {
          "application/json": {
            "schema": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "_id": { "type": "string" },
                  "user_id": { "type": "string" },
                  "gym_id": { "type": "string" },
                  "title": { "type": "string" },
                  "startTime": { "type": "integer" },
                  "endTime": { "type": "integer" },
                  "template": { "type": "boolean", "example": False }
                }
              }
            }
          }
        }
      }
    }
  }
},

"/AHFULworkouts/templates/user/{user_id}": {
  "get": {
    "summary": "Get workout templates for a user (User or Dev/Admin)",
    "tags": ["Workout"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "parameters": [
      {
        "name": "user_id",
        "in": "path",
        "required": True,
        "schema": { "type": "string" }
      }
    ],
    "responses": {
      "200": {
        "description": "Templates for the user",
        "content": {
          "application/json": {
            "schema": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "_id": { "type": "string" },
                  "user_id": { "type": "string" },
                  "title": { "type": "string" },
                  "startTime": { "type": "integer", "example": 0 },
                  "endTime": { "type": "integer", "example": 0 },
                  "template": { "type": "boolean", "example": True }
                }
              }
            }
          }
        }
      }
    }
  }
},

"/AHFULworkouts/templates/{id}": {
  "get": {
    "summary": "Get template by id (User or Dev/Admin)",
    "tags": ["Workout"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": True,
        "schema": { "type": "string" }
      }
    ],
    "responses": {
      "200": {
        "description": "Template found",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "_id": { "type": "string" },
                "user_id": { "type": "string" },
                "title": { "type": "string" },
                "startTime": { "type": "integer", "example": 0 },
                "endTime": { "type": "integer", "example": 0 },
                "template": { "type": "boolean", "example": True }
              }
            }
          }
        }
      },
      "404": {
        "description": "Template not found"
      }
    }
  }
},

"/AHFULworkouts/id/{workout_id}": {
  "get": {
    "summary": "Get workout by workout_id (User or Dev/Admin)",
    "tags": ["Workout"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "parameters": [
      {
        "name": "id",
        "in": "path",
        "required": True,
        "schema": { "type": "string" }
      }
    ],
    "responses": {
      "200": {
        "description": "Workout found",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "_id": { "type": "string" },
                "user_id": { "type": "string" },
                "gym_id": { "type": "string" },
                "title": { "type": "string" },
                "startTime": { "type": "integer" },
                "endTime": { "type": "integer" },
                "template": { "type": "boolean", "example": False }
              }
            }
          }
        }
      }
    }
  }
},

"/AHFULworkouts/create": {
  "post": {
    "summary": "Create a workout (Logged in)",
    "tags": ["Workout"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "requestBody": {
      "required": True,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "required": ["user_id", "startTime"],
            "properties": {
              "user_id": { "type": "string" },
              "gym_id": { "type": "string" },
              "title": { "type": "string" },
              "startTime": { "type": "integer" },
              "endTime": { "type": "integer" }
            }
          }
        }
      }
    },
    "responses": {
      "201": {
        "description": "Workout created"
      }
    }
  }
},

"/AHFULworkouts/create/template": {
  "post": {
    "summary": "Create a workout template (logged in)",
    "tags": ["Workout"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "requestBody": {
      "required": True,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "required": ["user_id", "title"],
            "properties": {
              "user_id": { "type": "string" },
              "title": { "type": "string" }
            }
          }
        }
      }
    },
    "responses": {
      "201": {
        "description": "Template created"
      }
    }
  }
},

"/AHFULworkouts/update/{workout_id}": {
  "put": {
    "summary": "Update a workout (User or Dev/Admin)",
    "tags": ["Workout"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "parameters": [
      {
        "name": "workout_id",
        "in": "path",
        "required": True,
        "schema": { "type": "string" }
      }
    ],
    "requestBody": {
      "required": True,
      "content": {
        "application/json": {
          "schema": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "startTime": { "type": "integer" },
              "endTime": { "type": "integer" }
            }
          }
        }
      }
    },
    "responses": {
      "200": {
        "description": "Workout updated"
      }
    }
  }
},

"/AHFULworkouts/delete/{workout_id}": {
  "delete": {
    "summary": "Delete a workout (User or Dev/Admin)",
    "tags": ["Workout"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "parameters": [
      {
        "name": "workout_id",
        "in": "path",
        "required": True,
        "schema": { "type": "string" }
      }
    ],
    "responses": {
      "200": {
        "description": "Workout deleted"
      }
    }
  }
},

"/AHFULworkouts/streak/{user_id}": {
  "get": {
    "summary": "Get workout streak (User or Dev/Admin)",
    "tags": ["Workout"],
    "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
    "parameters": [
      {
        "name": "user_id",
        "in": "path",
        "required": True,
        "schema": { "type": "string" }
      }
    ],
    "responses": {
      "200": {
        "description": "Workout streak data",
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "streak": { "type": "integer" },
                "lastWorkoutDate": { "type": "string", "nullable": True }
              }
            }
          }
        }
      }
    }
  }
},



    "/AHFULgyms/": {
      "get": {
        "summary": "Get all gyms (Logged in)",
        "tags": ["Gym"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "responses": {
          "200": {
            "description": "A list of gyms",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "_id": { "type": "string", "example": "698d039a6e5117c22dd7771d" },
                      "title": { "type": "string", "example": "Downtown Fitness" },
                      "address": { "type": "string", "example": "123 Main St, Anytown, USA" },
                      "cost": { "type": "number", "example": 49.99 },
                      "link": { "type": "string", "format": "uri", "example": "https://examplegym.com" }
                    },
                    "required": ["_id", "title", "address"]
                  }
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    
    "/AHFULgyms/{gym_id}": {
      "get": {
        "summary": "Get gym by id (Logged in)",
        "tags": ["Gym"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "gym_id",
            "in": "path",
            "required": True,
            "description": "The id of the gym (Mongo ObjectId as string)",
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Gym found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "_id": { "type": "string", "example": "698d039a6e5117c22dd7771d" },
                    "title": { "type": "string", "example": "Downtown Fitness" },
                    "address": { "type": "string", "example": "123 Main St, Anytown, USA" },
                    "cost": { "type": "number", "example": 49.99 },
                    "link": { "type": "string", "format": "uri", "example": "https://examplegym.com" }
                  },
                  "required": ["_id", "title", "address"]
                }
              }
            }
          },
          "404": {
            "description": "Gym not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    
    "/AHFULgyms/create": {
      "post": {
        "summary": "Create a new gym (Gym Owner)",
        "tags": ["Gym"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "requestBody": {
          "required": True,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["title", "address"],
                "properties": {
                  "title": { "type": "string", "example": "Downtown Fitness" },
                  "address": { "type": "string", "example": "123 Main St, Anytown, USA" },
                  "cost": { "type": "number", "example": 49.99 },
                  "link": { "type": "string", "format": "uri", "example": "https://examplegym.com" }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Gym created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "gym_id": { "type": "string", "example": "698d039a6e5117c22dd7771d" },
                    "message": { "type": "string", "example": "Gym created" }
                  },
                  "required": ["gym_id", "message"]
                }
              }
            }
          },
          "400": {
            "description": "Invalid input or creation error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    
    "/AHFULgyms/delete/{gym_id}": {
      "delete": {
        "summary": "Delete gym by id",
        "tags": ["Gym"],
        "parameters": [
          {
            "name": "gym_id",
            "in": "path",
            "required": True,
            "description": "The id of the gym (Mongo ObjectId as string)",
            "schema": { "type": "string", "example": "698d039a6e5117c22dd7771d" }
          }
        ],
        "responses": {
          "200": {
            "description": "Gym deleted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string", "example": "Gym deleted" },
                    "gym_id": { "type": "string", "example": "698d039a6e5117c22dd7771d" }
                  },
                  "required": ["message", "gym_id"]
                }
              }
            }
          },
          "404": {
            "description": "Gym not found or already deleted",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string", "example": "Gym not found or already deleted" }
                  },
                  "required": ["error"]
                }
              }
            }
          },
          "400": {
            "description": "Invalid id format or missing id",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string", "example": "You must provide a gym id to delete" }
                  },
                  "required": ["error"]
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  },
                  "required": ["error"]
                }
              }
            }
          }
        }
      }
    },
    
    "/AHFULgyms/update/{gym_id}": {
      "put": {
        "summary": "Update a gym",
        "description": "Updates allowed fields of a gym by id. The server treats PUT as a partial update.",
        "tags": ["Gym"],
        "parameters": [
          {
            "name": "gym_id",
            "in": "path",
            "required": True,
            "description": "The id of the gym (Mongo ObjectId as string)",
            "schema": { "type": "string", "example": "698d039a6e5117c22dd7771d" }
          }
        ],
        "requestBody": {
          "required": True,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name":    { "type": "string", "example": "Downtown Fitness" },
                  "address": { "type": "string", "example": "123 Main St, Anytown, USA" },
                  "cost":    { "type": "number", "example": 49.99 },
                  "link":    { "type": "string", "format": "uri", "example": "https://examplegym.com" },
                  "lat":     { "type": "number", "example": 44.876 },
                  "lng":     { "type": "number", "example": -91.932 },
                  "notes":   { "type": "string", "example": "24/7 access; towels included" }
                },
                "additionalProperties": False
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Gym updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string", "example": "Gym updated" },
                    "gym": {
                      "type": "object",
                      "properties": {
                        "_id":     { "type": "string", "example": "698d039a6e5117c22dd7771d" },
                        "name":    { "type": "string", "example": "Downtown Fitness" },
                        "address": { "type": "string", "example": "123 Main St, Anytown, USA" },
                        "cost":    { "type": "number", "example": 49.99 },
                        "link":    { "type": "string", "format": "uri", "example": "https://examplegym.com" },
                        "lat":     { "type": "number", "example": 44.876 },
                        "lng":     { "type": "number", "example": -91.932 },
                        "notes":   { "type": "string", "example": "24/7 access; towels included" }
                      },
                      "required": ["_id", "name", "address"]
                    }
                  },
                  "required": ["message", "gym"]
                }
              }
            }
          },
          "400": {
            "description": "Invalid input or no valid fields to update",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string", "example": "You must provide a JSON body with at least one field to update" }
                  },
                  "required": ["error"]
                }
              }
            }
          },
          "404": {
            "description": "Gym not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string", "example": "Gym not found" }
                  },
                  "required": ["error"]
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  },
                  "required": ["error"]
                }
              }
            }
          }
        }
      }
    },

    "/AHFULfoods/": {
      "get": {
        "summary": "Get all foods (Dev/Admin)",
        "tags": ["Food"],   
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "responses": {
          "200": {
            "description": "A list of foods",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "_id": { "type": "string", "example": "698d0bc06e5117c22dd7774b" },
                      "user_id": { "type": "string", "example": "abc123" },
                      "name": { "type": "string", "example": "Apple" },
                      "calsPerServing": { "type": "number", "example": 95 },
                      "servings": { "type": "number", "example": 1 },
                      "type": { "type": "string", "example": "Lunch" },
                      "time": { "type": "integer", "example": 1708473600 }
                    },
                    "required": ["_id", "user_id", "name", "calsPerServing", "servings", "time"]
                  }
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULfoods/{user_id}": {
      "get": {
        "summary": "Get foods by user_id (User or Dev/Admin)",
        "tags": ["Food"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": True,
            "description": "The user id associated with the foods",
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Foods for the specified user",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "_id": { "type": "string", "example": "698d0bc06e5117c22dd7774b" },
                      "user_id": { "type": "string", "example": "abc123" },
                      "name": { "type": "string", "example": "Apple" },
                      "calsPerServing": { "type": "number", "example": 95 },
                      "servings": { "type": "number", "example": 1 },
                      "type": { "type": "string", "example": "Lunch" },
                      "time": { "type": "integer", "example": 1708473600 }
                    },
                    "required": ["_id", "user_id", "name", "calsPerServing", "servings", "time"]
                  }
                }
              }
            }
          },
          "404": {
            "description": "Foods not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULfoods/id/{id}": {
      "get": {
        "summary": "Get food by id (Dev/Admin)",
        "tags": ["Food"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": True,
            "description": "Food id",
            "schema": { "type": "string"}
          }
        ],
        "responses": {
          "200": {
            "description": "Food found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                      "_id": { "type": "string", "example": "698d0bc06e5117c22dd7774b" },
                      "user_id": { "type": "string", "example": "abc123" },
                      "name": { "type": "string", "example": "Apple" },
                      "calsPerServing": { "type": "number", "example": 95 },
                      "servings": { "type": "number", "example": 1 },
                      "type": { "type": "string", "example": "Lunch" },
                      "time": { "type": "integer", "example": 1708473600 }
                    },
                    "required": ["_id", "user_id", "name", "calsPerServing", "servings", "time"]
                }
              }
            }
          },
          "404": {
            "description": "Food not found",
            "content": {
              "application/json": {
                "schema": { 
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULfoods/create": {
      "post": {
        "summary": "Create a new food entry (Logged in)",
        "tags": ["Food"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "requestBody": {
          "required": True,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["user_id", "name", "calsPerServing", "servings", "time"],
                "properties": {
                  "user_id": { "type": "string", "example": "abc123" },
                  "name": { "type": "string", "example": "Apple" },
                  "calsPerServing": { "type": "number", "example": 95 },
                  "servings": { "type": "number", "example": 1 },
                  "type": { "type": "string", "example": "Lunch" },
                  "time": { "type": "integer", "example": 1708473600 }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Food created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "food_id": { "type": "string", "example": "698d0bc06e5117c22dd7774b" },
                    "message": { "type": "string", "example": "Food created" }
                  },
                  "required": ["food_id", "message"]
                }
              }
            }
          },
          "400": {
            "description": "Invalid input or creation error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULfoods/delete/{food_id}": {
      "delete": {
        "summary": "Delete food by id (Owner or Dev/Admin)",
        "tags": ["Food"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "food_id",
            "in": "path",
            "required": True,
            "description": "The id of the food (Mongo ObjectId as string)",
            "schema": { "type": "string", "example": "698d039a6e5117c22dd6661d" }
          }
        ],
        "responses": {
          "200": {
            "description": "Food deleted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string", "example": "Food deleted" },
                    "gym_id": { "type": "string", "example": "698d039a6e5117c22dd7771d" }
                  },
                  "required": ["message", "food_id"]
                }
              }
            }
          },
          "404": {
            "description": "Food not found or already deleted",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string", "example": "Food not found or already deleted" }
                  },
                  "required": ["error"]
                }
              }
            }
          },
          "400": {
            "description": "Invalid id format or missing id",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string", "example": "You must provide a food id to delete" }
                  },
                  "required": ["error"]
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  },
                  "required": ["error"]
                }
              }
            }
          }
        }
      }
    }, 

    "/AHFULfoods/update/{food_id}": {
      "put": {
        "summary": "Update a food entry (Owner or Dev/Admin)",
        "description": "Updates allowed fields of a food entry by id. The server treats PUT as a partial update of allowed fields.",
        "tags": ["Food"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "food_id",
            "in": "path",
            "required": True,
            "description": "The id of the food entry (Mongo ObjectId as string)",
            "schema": { "type": "string", "example": "699d0f5f888d8f649698307e" }
          }
        ],
        "requestBody": {
          "required": True,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name":           { "type": "string",  "example": "Banana" },
                  "calsPerServing": { "type": "integer", "example": 105 },
                  "servings":       { "type": "integer", "example": 2 },
                  "type":           { "type": "string",  "example": "Snack" },
                  "time":           { "type": "number",  "example": 1708473601 }
                },
                "additionalProperties": False
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Food updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "_id":            { "type": "string",  "example": "699d0f5f888d8f649698307e" },
                    "user_id":         { "type": "string",  "example": "699d0093795741a59fe13616" },
                    "name":           { "type": "string",  "example": "Banana" },
                    "calsPerServing": { "type": "integer", "example": 105 },
                    "servings":       { "type": "integer", "example": 2 },
                    "type":           { "type": "string",  "example": "Snack" },
                    "time":           { "type": "number",  "example": 1708473601 }
                  },
                  "required": ["_id", "user_id", "name", "calsPerServing", "servings", "type", "time"]
                }
              }
            }
          },
          "400": {
            "description": "Invalid input or update error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string", "example": "No data provided" }
                  },
                  "required": ["error"]
                }
              }
            }
          },
          "404": {
            "description": "Food not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string", "example": "Food not found" }
                  },
                  "required": ["error"]
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  },
                  "required": ["error"]
                }
              }
            }
          }
        }
      }
    },
    
    "/AHFULmeasurements/": {
      "get": {
        "summary": "Get all measurements (Dev/Admin)",
        "tags": ["Measurements"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "responses": {
          "200": {
            "description": "A list of measurements",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "type": "object" }
                }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULmeasurements/{user_id}": {
      "get": {
        "summary": "Get measurements by user id (User or Dev/Admin)",
        "tags": ["Measurements"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": True,
            "description": "User ObjectId",
            "schema": { "type": "string", "example": "699d0093795741a59fe13616" }
          }
        ],
        "responses": {
          "200": {
            "description": "Measurements found for the user",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "type": "object" }
                }
              }
            }
          },
          "400": {
            "description": "Error retrieving measurements",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULmeasurements/id/{measurement_id}": {
      "get": {
        "summary": "Get a single measurement by id (Dev/Admin)",
        "tags": ["Measurements"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "measurement_id",
            "in": "path",
            "required": True,
            "description": "Measurement ObjectId",
            "schema": { "type": "string", "example": "698d039a6e5117c22dd7771d" }
          }
        ],
        "responses": {
          "200": {
            "description": "Measurement found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "_id": { "type": "string", "example": "698d039a6e5117c22dd7771d" },
                    "user_id": { "type": "string", "example": "699d0093795741a59fe13616" }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Measurement not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULmeasurements/create": {
      "post": {
        "summary": "Create a new measurement (Logged in)",
        "tags": ["Measurements"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "requestBody": {
          "required": True,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["user_id"],
                "properties": {
                  "user_id": { "type": "string", "description": "User ObjectId", "example": "699d0093795741a59fe13616" }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Measurement created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "measurement_id": { "type": "string", "example": "698d039a6e5117c22dd7771d" },
                    "message": { "type": "string", "example": "Measurement created" }
                  },
                  "required": ["measurement_id", "message"]
                }
              }
            }
          },
          "400": {
            "description": "Invalid input or creation error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULmeasurements/update/{measurement_id}": {
      "put": {
        "summary": "Update a measurement (Owner or Dev/Admin)",
        "description": "Partially updates a measurement. Only provided fields will be updated.",
        "tags": ["Measurements"],
        "security": [
          { "userIdHeader": [] },
          { "bearerAuth": [] }
        ],
        "parameters": [
          {
            "name": "measurement_id",
            "in": "path",
            "required": True,
            "description": "Measurement ID (Mongo ObjectId)",
            "schema": {
              "type": "string",
              "example": "69c449ceec7e3016c980840a"
            }
          }
        ],
        "requestBody": {
          "required": True,
          "description": "At least one field must be provided",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "date": {
                    "type": "integer",
                    "description": "Unix timestamp (seconds)",
                    "example": 1774396800
                  },
                  "arms": {
                    "type": "number",
                    "example": 31
                  },
                  "thighs": {
                    "type": "number",
                    "example": 61
                  },
                  "chest": {
                    "type": "number",
                    "example": 82
                  },
                  "waist": {
                    "type": "number",
                    "example": 138
                  },
                  "hips": {
                    "type": "number",
                    "example": 121
                  },
                  "weight": {
                    "type": "number",
                    "example": 248
                  }
                },
                "additionalProperties": False,
                "minProperties": 1
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Measurement updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input or no valid fields provided",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {
                      "type": "string",
                      "example": "No valid fields to update"
                    }
                  }
                }
              }
            }
          },
          "403": {
            "description": "Forbidden (not the owner or insufficient permissions)",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {
                      "type": "string",
                      "example": "Forbidden"
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "Measurement not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULmeasurements/delete/{measurement_id}": {
      "delete": {
        "summary": "Delete a measurement by id (Owner or Dev/Admin)",
        "tags": ["Measurements"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "measurement_id",
            "in": "path",
            "required": True,
            "description": "The id of the measurement (Mongo ObjectId as string)",
            "schema": { "type": "string", "example": "698d039a6e5117c22dd7771d" }
          }
        ],
        "responses": {
          "200": {
            "description": "Measurement deleted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string", "example": "Measurement deleted" },
                    "measurement_id": { "type": "string", "example": "698d039a6e5117c22dd7771d" }
                  },
                  "required": ["message", "measurement_id"]
                }
              }
            }
          },
          "400": {
            "description": "Error deleting measurement",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULauth/google-login": {
      "post": {
        "summary": "Login with Google (Public)",
        "tags": ["Auth"],
        "requestBody": {
          "required": True,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["token"],
                "properties": {
                  "token": { "type": "string", "description": "Google JWT token", "example": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Login successful",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string", "example": "Login successful" },
                    "user_info": { "type": "object", "description": "User information object" }
                  }
                }
              }
            }
          },
          "400": {
            "description": "No authentication data provided",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string", "example": "No authentication data provided" }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Invalid or disabled account",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string", "example": "Your account has been disabled" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULauth/logout": {
      "post": {
        "summary": "Logout user (Logged in)",
        "tags": ["Auth"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "requestBody": {
          "required": True,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["logout_email"],
                "properties": {
                  "logout_email": { "type": "string", "format": "email", "description": "Email of user to logout", "example": "user@example.com" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Logout successful",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string", "example": "Logout successful" }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Logout failed",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string", "example": "Logout failed" }
                  }
                }
              }
            }
          }
        }
      }
    },
    
    "/AHFULverify/email_flow/{user_id}": {
      "get": {
        "summary": "Trigger email verification flow (Admin)",
        "description": "Initiates or verifies the email verification flow for a specified user. Requires admin authentication.",
        "tags": ["Verify"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": True,
            "schema": {
              "type": "string"
            },
            "description": "Target user ID whose email verification flow is being triggered"
          }
        ],
        "responses": {
          "200": {
            "description": "Email verification triggered successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "description": "Verification service response"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized or insufficient permissions",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {
                      "type": "string",
                      "example": "Missing or invalid Authorization header"
                    }
                  }
                }
              }
            }
          },
          "404": {
            "description": "User not found or verification failed",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": {
                      "type": "string",
                      "example": "User not found"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULtasks/": {
      "get": {
        "summary": "Get all tasks (Dev/Admin)",
        "tags": ["Task"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "responses": {
          "200": {
            "description": "All tasks retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "_id": {
                        "type": "string",
                        "example": "69c6c4c05369bac3185cfdd0"
                      },
                      "name": {
                        "type": "string",
                        "example": "Newly Make Task"
                      },
                      "note": {
                        "type": "string",
                        "example": "This is something we should do while in class"
                      },
                      "dueTime": {
                        "type": "integer",
                        "example": 1774634100
                      },
                      "user_id": {
                        "type": "string",
                        "example": "69996a73313d1a459f4529da"
                      },
                      "created_at": {
                        "type": "integer",
                        "example": 1774616176
                      },
                      "updated_at": {
                        "type": "integer",
                        "example": 1774616176
                      },
                      "completed": {
                        "type": "boolean",
                        "example": True
                      }
                    }
                  }
                }
              }
            }
          },
          "500": {
            "description": "Server error while retrieving tasks",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULtasks/{task_id}": {
      "get": {
        "summary": "Get task by id",
        "tags": ["Task"],
        "parameters": [
          {
            "name": "task_id",
            "in": "path",
            "required": True,
            "description": "Task ObjectId",
            "schema": { "type": "string", "example": "698d039a6e5117c22dd7771d" }
          }
        ],
        "responses": {
          "200": {
            "description": "Task found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "404": {
            "description": "Task not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULtasks/user/{user_id}": {
      "get": {
        "summary": "Get tasks by user id (User or Dev/Admin)",
        "tags": ["Task"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": True,
            "description": "User ObjectId",
            "schema": { "type": "string", "example": "699d0093795741a59fe13616" }
          }
        ],
        "responses": {
          "200": {
            "description": "Tasks found for the user",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "type": "object" }
                }
              }
            }
          },
          "404": {
            "description": "Tasks not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULtasks/create/{user_id}": {
      "post": {
        "summary": "Create a new task (User or Dev/Admin)",
        "tags": ["Task"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": True,
            "description": "User ObjectId to associate task with",
            "schema": { "type": "string", "example": "699d0093795741a59fe13616" }
          }
        ],
        "requestBody": {
          "required": True,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "data": { "type": "object", "description": "Task data fields" }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Task created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input or creation error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULtasks/update/{task_id}": {
      "put": {
        "summary": "Update a task",
        "tags": ["Task"],
        "parameters": [
          {
            "name": "task_id",
            "in": "path",
            "required": True,
            "description": "Task ObjectId",
            "schema": { "type": "string", "example": "698d039a6e5117c22dd7771d" }
          }
        ],
        "requestBody": {
          "required": True,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "data": { "type": "object", "description": "Task data fields to update" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Task updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input or update error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULpromos/": {
      "get": {
        "summary": "Get all promos (Dev/Admin)",
        "tags": ["Promo"],
        "security": [
          { "userIdHeader": [] },
          { "bearerAuth": [] }
        ],
        "responses": {
          "200": {
            "description": "All promos retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "_id": { "type": "string", "example": "69efbaca3fb064208bde07c8" },
                      "gym_id": { "type": "string", "example": "699cff88400d9d43a32e924d" },
                      "type": { "type": "string", "example": "Coupon" },
                      "timeStart": { "type": "integer", "example": 1778873896 },
                      "timeEnd": { "type": "integer", "example": 1779451200 },
                      "redeemable": { "type": "boolean", "example": True },
                      "_testObject": { "type": "boolean", "example": True },
                      "created_at": { "type": "integer", "example": 1778870000 },
                      "updated_at": { "type": "integer", "example": 1778871111 }
                    }
                  }
                }
              }
            }
          },
          "500": {
            "description": "Server error while retrieving promos",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULpromos/{promo_id}": {
      "get": {
        "summary": "Get promo by id",
        "tags": ["Promo"],
        "parameters": [
          {
            "name": "promo_id",
            "in": "path",
            "required": True,
            "description": "Promo ObjectId",
            "schema": {
              "type": "string",
              "example": "69efbaca3fb064208bde07c8"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Promo found",
            "content": {
              "application/json": {
                "schema": { "type": "object" }
              }
            }
          },
          "404": {
            "description": "Promo not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULpromos/gym/{gym_id}": {
      "get": {
        "summary": "Get promos by gym id (Gym Owner)",
        "tags": ["Promo"],
        "security": [
          { "userIdHeader": [] },
          { "bearerAuth": [] }
        ],
        "parameters": [
          {
            "name": "gym_id",
            "in": "path",
            "required": True,
            "description": "Gym ObjectId",
            "schema": {
              "type": "string",
              "example": "699cff88400d9d43a32e924d"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Promos found for the gym",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "type": "object" }
                }
              }
            }
          },
          "404": {
            "description": "Promos not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULpromos/create/{gym_id}": {
      "post": {
        "summary": "Create a new promo (Gym Owner)",
        "tags": ["Promo"],
        "security": [
          { "userIdHeader": [] },
          { "bearerAuth": [] }
        ],
        "parameters": [
          {
            "name": "gym_id",
            "in": "path",
            "required": True,
            "description": "Gym ObjectId to associate promo with",
            "schema": {
              "type": "string",
              "example": "699cff88400d9d43a32e924d"
            }
          }
        ],
        "requestBody": {
          "required": True,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "data": {
                    "type": "object",
                    "description": "Promo data fields"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Promo created successfully",
            "content": {
              "application/json": {
                "schema": { "type": "object" }
              }
            }
          },
          "400": {
            "description": "Invalid input or creation error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULpromos/update/{promo_id}": {
      "put": {
        "summary": "Update a promo",
        "tags": ["Promo"],
        "parameters": [
          {
            "name": "promo_id",
            "in": "path",
            "required": True,
            "description": "Promo ObjectId",
            "schema": {
              "type": "string",
              "example": "69efbaff3fb064208bde07cd"
            }
          }
        ],
        "requestBody": {
          "required": True,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "data": {
                    "type": "object",
                    "description": "Promo data fields to update"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Promo updated successfully",
            "content": {
              "application/json": {
                "schema": { "type": "object" }
              }
            }
          },
          "400": {
            "description": "Invalid input or update error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULpromos/delete/{promo_id}": {
      "delete": {
        "summary": "Delete a promo by id",
        "tags": ["Promo"],
        "parameters": [
          {
            "name": "promo_id",
            "in": "path",
            "required": True,
            "description": "Promo ObjectId",
            "schema": {
              "type": "string",
              "example": "69efbb703fb064208bde07cf"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Promo deleted successfully",
            "content": {
              "application/json": {
                "schema": { "type": "object" }
              }
            }
          },
          "404": {
            "description": "Promo not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },


    "/AHFULtasks/delete/{task_id}": {
      "delete": {
        "summary": "Delete a task by id",
        "tags": ["Task"],
        "parameters": [
          {
            "name": "task_id",
            "in": "path",
            "required": True,
            "description": "Task ObjectId",
            "schema": { "type": "string", "example": "698d039a6e5117c22dd7771d" }
          }
        ],
        "responses": {
          "200": {
            "description": "Task deleted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "404": {
            "description": "Task not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULtokens/user/{user_id}": {
      "get": {
        "summary": "Get token by user id (User or Dev/Admin)",
        "tags": ["Token"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": True,
            "description": "User ObjectId",
            "schema": { "type": "string", "example": "699d0093795741a59fe13616" }
          }
        ],
        "responses": {
          "200": {
            "description": "Token found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "404": {
            "description": "Token not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULtokens/value/{token}": {
      "get": {
        "summary": "Get token by value (Admin)",
        "tags": ["Token"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "token",
            "in": "path",
            "required": True,
            "description": "Token value",
            "schema": { "type": "string", "example": "some_token_value" }
          }
        ],
        "responses": {
          "200": {
            "description": "Token found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "404": {
            "description": "Token not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULtokens/create/{user_id}": {
      "post": {
        "summary": "Create a token for user (User or Dev/Admin)",
        "tags": ["Token"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": True,
            "description": "User ObjectId",
            "schema": { "type": "string", "example": "699d0093795741a59fe13616" }
          }
        ],
        "requestBody": {
          "required": True,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["token"],
                "properties": {
                  "token": { "type": "string", "description": "Token value", "example": "new_token_value" }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Token created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "400": {
            "description": "Token is required",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string", "example": "token is required" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULtokens/delete/user/{user_id}": {
      "delete": {
        "summary": "Delete token by user id (User or Dev/Admin)",
        "tags": ["Token"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": True,
            "description": "User ObjectId",
            "schema": { "type": "string", "example": "699d0093795741a59fe13616" }
          }
        ],
        "responses": {
          "200": {
            "description": "Token deleted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "404": {
            "description": "Token not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULtokens/delete/value/{token}": {
      "delete": {
        "summary": "Delete token by value (Admin)",
        "tags": ["Token"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "token",
            "in": "path",
            "required": True,
            "description": "Token value",
            "schema": { "type": "string", "example": "some_token_value" }
          }
        ],
        "responses": {
          "200": {
            "description": "Token deleted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "404": {
            "description": "Token not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULuserSettings/{user_id}": {
      "get": {
        "summary": "Get user settings (User or Dev/Admin)",
        "tags": ["UserSettings"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": True,
            "description": "User ObjectId",
            "schema": { "type": "string", "example": "699d0093795741a59fe13616" }
          }
        ],
        "responses": {
          "200": {
            "description": "User settings found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "404": {
            "description": "Settings not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULuserSettings/create/{user_id}": {
      "post": {
        "summary": "Create user settings (User or Dev/Admin)",
        "tags": ["UserSettings"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": True,
            "description": "User ObjectId",
            "schema": { "type": "string", "example": "699d0093795741a59fe13616" }
          }
        ],
        "requestBody": {
          "required": False,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "settings": { "type": "object", "description": "Optional settings data" }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "User settings created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "400": {
            "description": "Error creating settings",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULuserSettings/createDefault/{user_id}": {
      "post": {
        "summary": "Create default user settings (User or Dev/Admin)",
        "tags": ["UserSettings"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": True,
            "description": "User ObjectId",
            "schema": { "type": "string", "example": "699d0093795741a59fe13616" }
          }
        ],
        "responses": {
          "201": {
            "description": "Default user settings created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "400": {
            "description": "Error creating default settings",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULuserSettings/update/{user_id}": {
      "put": {
        "summary": "Update user settings (User or Dev/Admin)",
        "tags": ["UserSettings"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": True,
            "description": "User ObjectId",
            "schema": { "type": "string", "example": "699d0093795741a59fe13616" }
          }
        ],
        "requestBody": {
          "required": True,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "data": { "type": "object", "description": "Settings data fields to update" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "User settings updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input or update error",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },

    "/AHFULuserSettings/delete/{user_id}": {
      "delete": {
        "summary": "Delete user settings (User or Dev/Admin)",
        "tags": ["UserSettings"],
        "security":[{"userIdHeader":[]},{"bearerAuth":[]}],
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": True,
            "description": "User ObjectId",
            "schema": { "type": "string", "example": "699d0093795741a59fe13616" }
          }
        ],
        "responses": {
          "200": {
            "description": "User settings deleted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "404": {
            "description": "Settings not found",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "error": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
  }
}