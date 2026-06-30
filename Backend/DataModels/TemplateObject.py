# DataModel & Objects are essentially the Database Access Layer
# They know how to talk to Mongo DB Collection and that is it. 
from bson import ObjectId
from Services.MongoDriver import get_collection

class TemplateObject:
    # ── Helpers ────────────────────────────────────────────────────────────────
    @staticmethod
    def _serialize(template):
        """Convert MongoDB document to JSON-safe dict."""
        if template:
            template["_id"] = str(template["_id"])
            template["user_id"] = str(template["user_id"])
        return template
    
    @staticmethod
    def create(template_data):
        result = get_collection('template').insert_one(template_data)
        return str(result.inserted_id)
    
    @staticmethod
    def find_template(id):
        template = get_collection('template').find_one({
            "_id": ObjectId(id),
        })
        return TemplateObject._serialize(template)

    @staticmethod
    def find_user_templates(user_id):
        template = get_collection('template').find({
            "user_id": ObjectId(user_id),
        })
        return [TemplateObject._serialize(t) for t in template]
    
    # ── Delete ──────────────────────────────────────────────────────────────────
    @staticmethod
    def delete(id):
        result = get_collection('template').delete_one({"_id": ObjectId(id)})
        return id if result.deleted_count == 1 else None
